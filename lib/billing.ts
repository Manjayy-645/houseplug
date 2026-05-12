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

  // Update payment record to success
  const { error: paymentError } = await supabase
    .from('payments')
    .update({ status: 'success' })
    .eq('paystack_reference', reference)

  if (paymentError) {
    console.error('[BILLING] Failed to update payment record:', paymentError)
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
    const boostDays: Record<string, number> = {
      featured_7: 7,
      featured_30: 30,
      urgent: 7,
      refresh: 0,
    }

    const days = boostDays[boost_type]
    const expires_at = new Date()
    expires_at.setDate(expires_at.getDate() + days)

    console.log('[BILLING] Processing boost:', { listing_id, boost_type, expires_at })

    const { error: boostError } = await supabase
      .from('listing_boosts')
      .insert({
        listing_id,
        landlord_id,
        boost_type,
        expires_at: days > 0 ? expires_at.toISOString() : null,
        paystack_reference: reference,
      })

    if (boostError) {
      console.error('[BILLING] Boost insert error:', boostError)
      throw new Error(`Boost insert failed: ${boostError.message}`)
    }

    if (boost_type === 'featured_7' || boost_type === 'featured_30') {
      await supabase.from('listings').update({
        is_featured: true,
        boost_expires_at: expires_at.toISOString(),
      }).eq('id', listing_id)
    }

    if (boost_type === 'urgent') {
      await supabase.from('listings')
        .update({ is_urgent: true })
        .eq('id', listing_id)
    }

    if (boost_type === 'refresh') {
      await supabase.from('listings')
        .update({ created_at: new Date().toISOString() })
        .eq('id', listing_id)
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

  // Get most recent subscription regardless of active status
  const { data: active } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('landlord_id', landlord_id)
    .eq('active', true)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (active) return { ...active, expired: false }

  // Check if they had a subscription that expired
  const { data: expired } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('landlord_id', landlord_id)
    .eq('active', false)
    .order('expires_at', { ascending: false })
    .limit(1)
    .single()

  if (expired) return { ...expired, expired: true }

  // Never subscribed — return free plan defaults
  return {
    plan: 'free',
    active: true,
    expired: false,
    billing_cycle: null,
    expires_at: null,
  }
}

export function getListingLimit(plan: string): number {
  const limits: Record<string, number> = {
    free: 1,
    pro: 5,
    business: Infinity,
  }
  return limits[plan] ?? 1
}

export function isSubscriptionExpiringSoon(expires_at: string | null): boolean {
  if (!expires_at) return false
  const threeDaysFromNow = new Date()
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
  return new Date(expires_at) < threeDaysFromNow
}

export function formatExpiryDate(expires_at: string | null): string {
  if (!expires_at) return "N/A"
  return new Date(expires_at).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}
