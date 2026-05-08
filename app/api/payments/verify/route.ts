import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { reference } = (await request.json()) as { reference?: string }
  if (!reference) {
    return NextResponse.json({ error: "Payment reference is required" }, { status: 400 })
  }

  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) {
    return NextResponse.json({ error: "Paystack key missing" }, { status: 500 })
  }

  const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${secret}` }
  })

  const verifyData = await verifyResponse.json()
  if (!verifyResponse.ok || !verifyData.status || verifyData.data.status !== "success") {
    return NextResponse.json({ error: verifyData.message ?? "Verification failed" }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Supabase service key missing" }, { status: 500 })
  }
  const service = createServiceClient(supabaseUrl, serviceKey)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  await service.from("subscriptions").update({ active: false }).eq("landlord_id", user.id)

  const { error: subError } = await service.from("subscriptions").insert({
    landlord_id: user.id,
    plan: "pro",
    active: true,
    expires_at: expiresAt.toISOString()
  })

  if (subError) {
    return NextResponse.json({ error: subError.message }, { status: 500 })
  }

  // Feature all current active listings for this landlord
  await service
    .from("listings")
    .update({ is_featured: true })
    .eq("landlord_id", user.id)
    .eq("status", "active")

  return NextResponse.json({ success: true })
}

