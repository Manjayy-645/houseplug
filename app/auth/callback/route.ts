import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { grantTrialToNewUser } from "@/lib/billing"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type")
  const roleParam = searchParams.get("role") // set by Google OAuth signup

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

  // Service role to read/write profile + trial tables (RLS-locked).
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Only student/landlord may be self-selected at signup — never admin roles.
  const requestedRole =
    roleParam === "landlord" ? "landlord" : roleParam === "student" ? "student" : null

  const { data: profile } = await serviceClient
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle()

  if (profile) {
    // The handle_new_user trigger pre-creates OAuth profiles as 'student'
    // (Google sends no role in metadata). When the user explicitly signed up as
    // a landlord, promote them and grant the trial — email-keyed since Google
    // provides no phone.
    if (requestedRole === "landlord" && profile.role === "student") {
      await serviceClient.from("profiles").update({ role: "landlord" }).eq("id", user.id)
      await grantTrialToNewUser(serviceClient, user.id, undefined, user.email ?? undefined)
      return redirectByRole("landlord", origin)
    }
    return redirectByRole(profile.role, origin)
  }

  // No profile (trigger didn't run) — create it as a fallback.
  const meta = user.user_metadata ?? {}
  const role = requestedRole || meta.role || "student"
  const fullName = meta.full_name || meta.name || "User"

  const { error: insertError } = await serviceClient.from("profiles").insert({
    id: user.id,
    email: user.email,
    full_name: fullName,
    phone: meta.phone || "",
    role,
    created_at: new Date().toISOString(),
  })
  if (insertError) {
    console.error("[AUTH CALLBACK] Profile insert failed:", insertError)
  }

  if (role === "landlord") {
    // Prefer phone (email/password fallback path), else email (Google OAuth).
    await grantTrialToNewUser(serviceClient, user.id, meta.phone || undefined, user.email ?? undefined)
  }

  return redirectByRole(role, origin)
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
