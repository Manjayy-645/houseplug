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
