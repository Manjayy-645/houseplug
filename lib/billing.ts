import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function processSuccessfulPayment(transaction: any) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createSupabaseClient(supabaseUrl, serviceKey)

  const { metadata, reference, amount } = transaction
  const { landlord_id, type, plan, billing_cycle, listing_id, boost_type } = metadata

  // Update payment record to success
  await supabase
    .from('payments')
    .update({ status: 'success' })
    .eq('paystack_reference', reference)

  if (type === 'subscription') {
    const months = billing_cycle === 'annual' ? 12 : 1
    const expires_at = new Date()
    expires_at.setMonth(expires_at.getMonth() + months)

    // Deactivate existing subscription first
    await supabase
      .from('subscriptions')
      .update({ active: false })
      .eq('landlord_id', landlord_id)

    // Upsert subscription
    await supabase.from('subscriptions').upsert({
      landlord_id,
      plan,
      billing_cycle,
      active: true,
      amount_paid: amount,
      paystack_reference: reference,
      expires_at: expires_at.toISOString(),
    }, { onConflict: 'landlord_id' })

    // Set all their active listings as featured
    await supabase
      .from('listings')
      .update({ is_featured: true })
      .eq('landlord_id', landlord_id)
      .eq('status', 'active')
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

    // Insert boost record
    await supabase.from('listing_boosts').insert({
      listing_id,
      landlord_id,
      boost_type,
      expires_at: days > 0 ? expires_at.toISOString() : null,
      paystack_reference: reference,
    })

    // Apply boost to listing
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
      // Update created_at to now to bump to top of newest sort
      await supabase.from('listings')
        .update({ created_at: new Date().toISOString() })
        .eq('id', listing_id)
    }
  }

  if (type === 'verification') {
    // Mark listing as pending admin review with fee paid
    await supabase.from('listings')
      .update({ status: 'pending' })
      .eq('landlord_id', landlord_id)
      .eq('status', 'inactive')
      .limit(1)
  }
}
