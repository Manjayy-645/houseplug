import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { initializePaystackTransaction, PLAN_PRICES, BOOST_PRICES, VERIFICATION_FEE } from "@/lib/paystack"

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { type, plan, billing_cycle, listing_id, boost_type } = await request.json()

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, role")
    .eq("id", user.id)
    .single()

  if (!profile || (profile.role !== "landlord" && profile.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let amount = 0
  if (type === 'subscription') {
    const key = `${plan}_${billing_cycle}` as keyof typeof PLAN_PRICES
    amount = PLAN_PRICES[key]
  } else if (type === 'boost') {
    amount = BOOST_PRICES[boost_type as keyof typeof BOOST_PRICES]
  } else if (type === 'verification') {
    amount = VERIFICATION_FEE
  }

  if (!amount) {
    return NextResponse.json({ error: "Invalid payment type or plan" }, { status: 400 })
  }

  const metadata = {
    landlord_id: user.id,
    type,
    plan,
    billing_cycle,
    listing_id,
    boost_type
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
      amount,
      paystack_reference: reference,
      status: 'pending'
    })

    return NextResponse.json({ authorization_url, reference })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Paystack init failed" }, { status: 400 })
  }
}
