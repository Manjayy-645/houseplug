"use server"

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

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
    const { error: verifyError } = await supabase
      .from('listings')
      .update({ status: 'pending' })
      .eq('landlord_id', landlord_id)
      .eq('status', 'inactive')
      .limit(1)

    if (verifyError) {
      console.error('[BILLING] Verification update error:', verifyError)
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

export function getListingLimit(plan: string): number {
  return Infinity
}

export function formatListingLimit(plan: string): string {
  return 'Unlimited'
}

import { isSubscriptionExpiringSoon as isSubscriptionExpiringSoonUtil, formatExpiryDate as formatExpiryDateUtil } from './billing-utils'

export async function isSubscriptionExpiringSoon(expires_at: string | null): Promise<boolean> {
  return isSubscriptionExpiringSoonUtil(expires_at)
}

export async function formatExpiryDate(expires_at: string | null): Promise<string> {
  return formatExpiryDateUtil(expires_at)
}
