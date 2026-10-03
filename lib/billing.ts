"use server"

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { sendAdminNotification } from './email'

export async function processSuccessfulPayment(transaction: any) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createSupabaseClient(supabaseUrl, serviceKey)

  const { metadata, reference, amount } = transaction
  console.log('[BILLING] Processing payment:', { reference, amount, metadata })

  if (!metadata || !metadata.landlord_id) {
    throw new Error(`Missing metadata in transaction: ${reference}`)
  }

  const { landlord_id, type, plan, billing_cycle, listing_id, boost_type } = metadata

  // Idempotency: the initiate route inserts a pending payment row, and BOTH the
  // callback and the webhook call this function for the same reference. If we've
  // already marked this reference successful, the side effects ran — bail out so
  // we don't double-apply boosts or duplicate listing_boosts rows.
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id, status')
    .eq('paystack_reference', reference)
    .maybeSingle()

  if (existingPayment?.status === 'success') {
    console.log('[BILLING] Payment already processed, skipping:', reference)
    return
  }

  if (existingPayment) {
    // Flip the pending row created at initiate time to success.
    const { error: paymentError } = await supabase
      .from('payments')
      .update({ status: 'success' })
      .eq('paystack_reference', reference)
    if (paymentError) {
      console.error('[BILLING] Failed to update payment record:', paymentError)
    }
  } else {
    // No pending row (e.g. webhook arrived first) — record it now.
    const { error: insertError } = await supabase.from('payments').insert({
      landlord_id,
      type,
      plan: plan ?? null,
      billing_cycle: billing_cycle ?? null,
      listing_id: listing_id ?? null,
      boost_type: boost_type ?? null,
      amount,
      paystack_reference: reference,
      status: 'success',
    })
    if (insertError) {
      console.error('[BILLING] Failed to insert payment record:', insertError)
    }
  }

  if (type === 'subscription') {
    const months = billing_cycle === 'annual' ? 12 : 1
    const expires_at = new Date()
    expires_at.setMonth(expires_at.getMonth() + months)

    console.log('[BILLING] Upserting subscription:', { landlord_id, plan, billing_cycle, expires_at })

    const { error: subError } = await supabase
      .from('subscriptions')
      .upsert({
        landlord_id,
        plan,
        billing_cycle,
        is_trial: false,
        active: true,
        amount_paid: amount,
        paystack_reference: reference,
        expires_at: expires_at.toISOString(),
      }, { onConflict: 'landlord_id' })

    if (subError) {
      console.error('[BILLING] Subscription upsert error:', subError)
      throw new Error(`Subscription upsert failed: ${subError.message}`)
    }

    // Set all active listings as featured
    const { error: featuredError } = await supabase
      .from('listings')
      .update({ is_featured: true })
      .eq('landlord_id', landlord_id)
      .eq('status', 'active')

    if (featuredError) {
      console.error('[BILLING] Featured update error:', featuredError)
    }

    console.log('[BILLING] Subscription updated successfully')
  }

  if (type === 'boost') {
    if (!listing_id || !boost_type) {
      console.error('[BILLING] Boost missing listing_id or boost_type:', metadata)
      return
    }

    const now = new Date()
    let expiresAt: Date | null = null
    const updateData: Record<string, any> = {}

    if (boost_type === 'featured_7') {
      expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      updateData.is_featured = true
      updateData.boost_expires_at = expiresAt.toISOString()
    } else if (boost_type === 'featured_30') {
      expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      updateData.is_featured = true
      updateData.boost_expires_at = expiresAt.toISOString()
    } else if (boost_type === 'urgent') {
      expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      updateData.is_urgent = true
      updateData.boost_expires_at = expiresAt.toISOString()
    } else if (boost_type === 'refresh') {
      // Browse sorts newest by created_at, so bumping it floats the listing up.
      updateData.created_at = now.toISOString()
    } else {
      console.error('[BILLING] Unknown boost_type:', boost_type)
      return
    }

    console.log('[BILLING] Processing boost:', { listing_id, boost_type, expiresAt })

    // Apply the boost to the listing FIRST so the badge/placement lands even if
    // the audit-trail insert below fails. Never throw here.
    const { error: updateError } = await supabase
      .from('listings')
      .update(updateData)
      .eq('id', listing_id)

    if (updateError) {
      console.error('[BILLING] Failed to apply boost to listing:', updateError)
    }

    // Best-effort audit record — must never crash the payment flow.
    try {
      const { error: boostError } = await supabase.from('listing_boosts').insert({
        listing_id,
        landlord_id,
        boost_type,
        amount,
        active: boost_type !== 'refresh',
        expires_at: expiresAt ? expiresAt.toISOString() : now.toISOString(),
        paystack_reference: reference,
      })
      if (boostError) {
        console.error('[BILLING] listing_boosts insert error:', boostError)
      }
    } catch (e) {
      console.error('[BILLING] listing_boosts insert threw:', e)
    }

    console.log('[BILLING] Boost applied successfully')
  }

  if (type === 'verification') {
    // Mark paid (so a rejected user can resubmit for free) and submit the docs
    // that were uploaded before payment and carried through the metadata.
    const { error: verifyError } = await supabase
      .from('profiles')
      .update({
        verification_paid: true,
        verification_payment_ref: reference,
        verification_status: 'pending',
        id_document_url: metadata.id_document_url ?? null,
        id_document_back_url: metadata.id_document_back_url ?? null,
        selfie_url: metadata.selfie_url ?? null,
        property_document_url: metadata.property_document_url ?? null,
        id_document_type: metadata.id_document_type ?? null,
        nin_number: metadata.nin_number ?? null,
        verification_type: metadata.verification_type ?? 'identity',
        verification_note: null,
      })
      .eq('id', landlord_id)

    if (verifyError) {
      console.error('[BILLING] Verification update error:', verifyError)
    }

    await sendAdminNotification(
      'New Verification Submission',
      'A landlord/agent has paid and submitted documents for verification. Review their ID and property docs.',
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://houseplug.ng'}/admin/verification`,
      'Review Verification'
    )
  }

  if (type === 'success_fee') {
    if (!listing_id) {
      console.error('[BILLING] Success fee missing listing_id:', metadata)
      return
    }

    const { error: updateError } = await supabase
      .from('listings')
      .update({ status: 'unavailable' })
      .eq('id', listing_id)
      .eq('landlord_id', landlord_id)

    if (updateError) {
      console.error('[BILLING] Failed to apply success fee (mark unavailable):', updateError)
    } else {
      console.log('[BILLING] Success fee applied successfully, listing marked unavailable:', listing_id)
    }
  }
}

export async function getLandlordSubscription(landlord_id: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createSupabaseClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // Get the most recent subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('landlord_id', landlord_id)
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!subscription) {
    // Never subscribed — return free plan defaults
    return {
      plan: 'free',
      active: true,
      expired: false,
      billing_cycle: null,
      expires_at: null,
    }
  }

  const isExpired = !subscription.active || (subscription.expires_at && new Date(subscription.expires_at) < new Date())

  return { 
    ...subscription, 
    expired: isExpired 
  }
}

// True for an active paid OR trial Pro/Business subscription that hasn't expired.
export async function hasProAccess(landlord_id: string): Promise<boolean> {
  const sub = await getLandlordSubscription(landlord_id)
  return !sub.expired && ['pro', 'business'].includes(sub.plan)
}

export async function getListingLimit(plan: string): Promise<number> {
  if (plan === 'business') return Infinity

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createSupabaseClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const key = plan === 'pro' ? 'max_pro_listings' : 'max_free_listings'

  const { data } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle()

  if (data?.value) {
    const num = parseInt(data.value, 10)
    if (!isNaN(num)) return num
  }
  
  // Fallbacks if not configured in DB
  return plan === 'pro' ? Infinity : Infinity 
}

export async function formatListingLimit(plan: string): Promise<string> {
  if (plan === 'business') return 'Unlimited'
  const limit = await getListingLimit(plan)
  return limit === Infinity ? 'Unlimited' : limit.toString()
}

import { isSubscriptionExpiringSoon as isSubscriptionExpiringSoonUtil, formatExpiryDate as formatExpiryDateUtil } from './billing-utils'

export async function isSubscriptionExpiringSoon(expires_at: string | null): Promise<boolean> {
  return isSubscriptionExpiringSoonUtil(expires_at)
}

export async function formatExpiryDate(expires_at: string | null): Promise<string> {
  return formatExpiryDateUtil(expires_at)
}

/**
 * Grant a 30-day Pro trial to a new landlord. Centralised so every signup path
 * (email + Google OAuth) shares one set of rules. Caller is responsible for the
 * landlord-role gate; students must never be passed here.
 *
 * Abuse prevention: one trial per phone (email/password signups) or per email
 * (Google OAuth, which has no phone). Existing subscribers are skipped so a
 * trial is never duplicated. Never throws — failures are logged.
 *
 * `supabase` must be a service-role client (these registry/subscription tables
 * are RLS-locked).
 */
export async function grantTrialToNewUser(
  supabase: any,
  userId: string,
  phone?: string,
  email?: string
): Promise<void> {
  try {
    // Never duplicate an existing subscription.
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('landlord_id', userId)
      .maybeSingle()
    if (existing) return

    // Registry check — phone first (email/password signups), then email (OAuth).
    const normalizedPhone = (phone ?? '').replace(/[^0-9]/g, '')
    if (normalizedPhone) {
      const { data: used } = await supabase
        .from('trial_phone_registry')
        .select('phone')
        .eq('phone', normalizedPhone)
        .maybeSingle()
      if (used) return

      await supabase
        .from('trial_phone_registry')
        .upsert({ phone: normalizedPhone }, { onConflict: 'phone', ignoreDuplicates: true })
    } else if (email) {
      const { data: used } = await supabase
        .from('trial_email_registry')
        .select('email')
        .eq('email', email)
        .maybeSingle()
      if (used) return

      await supabase
        .from('trial_email_registry')
        .upsert({ email }, { onConflict: 'email', ignoreDuplicates: true })
    } else {
      return // no identifier to dedupe on
    }

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    await supabase
      .from('subscriptions')
      .upsert(
        {
          landlord_id: userId,
          plan: 'pro',
          is_trial: true,
          active: true,
          billing_cycle: 'trial',
          amount_paid: 0,
          expires_at: expiresAt,
        },
        { onConflict: 'landlord_id', ignoreDuplicates: true }
      )
  } catch (error) {
    console.error('[billing] grantTrialToNewUser failed:', error)
  }
}
