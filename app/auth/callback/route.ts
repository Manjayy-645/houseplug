import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type")

  const supabase = createClient()

  // The PKCE email link carries ?code= (default for @supabase/ssr). Older
  // token-hash templates carry ?token_hash=&type=. Support both.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error("[AUTH CALLBACK] Session exchange failed:", error)
      return NextResponse.redirect(`${origin}/login?error=session_failed`)
    }
  } else if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
    if (error) {
      console.error("[AUTH CALLBACK] Link verification failed:", error)
      return NextResponse.redirect(`${origin}/login?error=verification_failed`)
    }
  } else {
    console.error("[AUTH CALLBACK] No code or token_hash in URL")
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error("[AUTH CALLBACK] No user after verification")
    return NextResponse.redirect(`${origin}/login?error=session_failed`)
  }

  // Ensure a profile exists, using the service role to bypass RLS. The
  // handle_new_user trigger normally creates it at sign-up; this is the
  // fallback if the trigger ever failed silently.
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: profile } = await serviceClient
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle()

  if (profile) {
    return redirectByRole(profile.role, origin)
  }

  const meta = user.user_metadata ?? {}
  const role = meta.role || "student"

  const { error: insertError } = await serviceClient.from("profiles").insert({
    id: user.id,
    email: user.email,
    full_name: meta.full_name || "User",
    phone: meta.phone || "",
    role,
    created_at: new Date().toISOString(),
  })
  if (insertError) {
    console.error("[AUTH CALLBACK] Profile insert failed:", insertError)
  }

  await grantLandlordTrialIfEligible(serviceClient, user.id, role, meta.phone)

  return redirectByRole(role, origin)
}

// Mirror of the DB trial grant for the fallback path: if the trigger created
// the profile we never reach here, but when the callback creates it we still
// want landlords to get their 30-day Pro trial (once per phone number).
async function grantLandlordTrialIfEligible(
  serviceClient: SupabaseClient,
  userId: string,
  role: string,
  phone: unknown
) {
  if (role !== "landlord") return
  const normalized = String(phone ?? "").replace(/[^0-9]/g, "")
  if (!normalized) return

  try {
    const { data: used } = await serviceClient
      .from("trial_phone_registry")
      .select("phone")
      .eq("phone", normalized)
      .maybeSingle()
    if (used) return

    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    await serviceClient.from("subscriptions").insert({
      landlord_id: userId,
      plan: "pro",
      is_trial: true,
      active: true,
      billing_cycle: "trial",
      amount_paid: 0,
      expires_at: expires,
    })
    await serviceClient.from("trial_phone_registry").insert({ phone: normalized })
  } catch (error) {
    console.error("[AUTH CALLBACK] Trial grant failed:", error)
  }
}

function redirectByRole(role: string, origin: string) {
  switch (role) {
    case "landlord":
      return NextResponse.redirect(`${origin}/landlord/dashboard`)
    case "admin":
    case "super_admin":
      return NextResponse.redirect(`${origin}/admin/listings`)
    case "student":
    default:
      return NextResponse.redirect(`${origin}/browse`)
  }
}
