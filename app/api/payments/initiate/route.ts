import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { initializePaystackTransaction, getPlanPrices } from "@/lib/paystack"

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { type, plan, billing_cycle, listing_id, boost_type, verification, service_id } = await request.json()

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, role")
    .eq("id", user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Service payments are open to all users; housing payments require landlord/agent/admin
  const isServicePayment = type === 'service_listing' || type === 'service_boost'
  if (!isServicePayment && !['landlord', 'agent', 'admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const prices = await getPlanPrices()

  let amount = 0
  if (type === 'subscription') {
    if (plan === 'pro') {
      amount = billing_cycle === 'annual' ? prices.pro_annual : prices.pro_monthly
    } else if (plan === 'business') {
      amount = billing_cycle === 'annual' ? prices.business_annual : prices.business_monthly
    }
  } else if (type === 'boost') {
    amount = prices[boost_type as keyof typeof prices] || 0
  } else if (type === 'verification') {
    amount = prices.verification
  } else if (type === 'success_fee') {
    amount = 100000 // 1000 Naira in kobo
  } else if (type === 'service_listing') {
    amount = prices.service_listing
  } else if (type === 'service_boost') {
    amount = prices[boost_type as keyof typeof prices] || 0
  }

  if (!amount) {
    return NextResponse.json({ error: "Invalid payment type or plan" }, { status: 400 })
  }

  const metadata: Record<string, any> = {
    landlord_id: user.id,
    type,
    plan,
    billing_cycle,
    listing_id,
    boost_type,
    service_id
  }

  // Carry the (already-uploaded) document URLs through Paystack so the payment
  // processor can submit the verification server-side after a successful charge.
  if (type === "verification" && verification) {
    Object.assign(metadata, {
      id_document_url: verification.id_document_url ?? null,
      id_document_back_url: verification.id_document_back_url ?? null,
      selfie_url: verification.selfie_url ?? null,
      property_document_url: verification.property_document_url ?? null,
      id_document_type: verification.id_document_type ?? null,
      nin_number: verification.nin_number ?? null,
      verification_type: verification.verification_type ?? "identity"
    })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) {
    return NextResponse.json({ error: "NEXT_PUBLIC_APP_URL is not set" }, { status: 500 })
  }
  const callback_url = `${appUrl}/api/payments/callback`

  try {
    const { authorization_url, reference } = await initializePaystackTransaction({
      email: profile.email,
      amount,
      metadata,
      callback_url
    })

    // Insert pending payment record
    await supabase.from('payments').insert({
      landlord_id: user.id,
      type,
      plan,
      billing_cycle,
      listing_id,
      boost_type,
      service_id,
      amount,
      paystack_reference: reference,
      status: 'pending'
    })

    return NextResponse.json({ authorization_url, reference })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Paystack init failed" }, { status: 400 })
  }
}
