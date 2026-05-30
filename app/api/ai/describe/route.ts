import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hasProAccess } from "@/lib/billing"

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  // Pro gate — AI descriptions are a Pro (or trial) feature.
  const isPro = await hasProAccess(user.id)
  if (!isPro) {
    return NextResponse.json(
      { error: "pro_required", message: "AI descriptions are a Pro feature. Upgrade to unlock." },
      { status: 403 }
    )
  }

  // Listing context the future prompt will use (title, area, room_type, amenities, …).
  const payload = await request.json().catch(() => ({}))
  void payload

  // --- UI SHELL ---
  // Generation is intentionally stubbed: no live LLM call is made yet. To make
  // this real, pick a provider (Anthropic/OpenAI), add its API key as an env
  // var, build a prompt from `payload`, call the model, and return
  // `{ description }`. The gating + client flow above/around this are complete.
  return NextResponse.json(
    { error: "not_configured", message: "AI descriptions are coming soon for Pro members." },
    { status: 503 }
  )
}
