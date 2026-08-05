import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { email } = await request.json()

  if (!email || !email.includes("@")) {
    return NextResponse.json({ exists: false }, { status: 400 })
  }

  const supabase = createClient()

  // Check if a profile with this email exists
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle()

  if (error) {
    // Don't leak internal errors — just return false
    return NextResponse.json({ exists: false })
  }

  return NextResponse.json({ exists: !!data })
}
