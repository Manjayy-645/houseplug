import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/sms/notify
 *
 * Sends an SMS notification via Termii (Nigerian SMS gateway).
 * If TERMII_API_KEY is not configured, falls back to a console log
 * so the rest of the admin workflow isn't blocked.
 *
 * Body: { phone: string, message: string }
 * Protected: caller must be admin or super_admin.
 */
export async function POST(req: NextRequest) {
  try {
    // Auth guard — only admins can trigger SMS via this route
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!["admin", "super_admin"].includes(profile?.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { phone, message } = body as { phone: string; message: string }

    if (!phone || !message) {
      return NextResponse.json({ error: "phone and message are required" }, { status: 400 })
    }

    // Normalize to international format: 08012345678 → 2348012345678
    const normalized = phone.startsWith("0")
      ? "234" + phone.slice(1)
      : phone

    const termiiKey = process.env.TERMII_API_KEY

    if (!termiiKey) {
      // Graceful fallback — log and return success so the creation flow isn't blocked
      console.log(
        `[SMS] TERMII_API_KEY not set. Would have sent to ${normalized}:`,
        message
      )
      return NextResponse.json({
        success: true,
        note: "SMS not sent — TERMII_API_KEY not configured.",
      })
    }

    // Termii API call
    const termiiRes = await fetch("https://api.ng.termii.com/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: normalized,
        from: "HousePlug",
        sms: message,
        type: "plain",
        api_key: termiiKey,
        channel: "generic",
      }),
    })

    const termiiData = await termiiRes.json()

    if (!termiiRes.ok) {
      console.error("[SMS] Termii error:", termiiData)
      return NextResponse.json(
        { error: "SMS provider error", detail: termiiData },
        { status: 502 }
      )
    }

    return NextResponse.json({ success: true, provider: "termii", data: termiiData })
  } catch (err: any) {
    console.error("[SMS] Unexpected error:", err)
    // Never crash the calling flow
    return NextResponse.json({ success: true, note: "SMS failed silently.", error: err?.message })
  }
}
