import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { grantTrialToNewUser } from "@/lib/billing"
import { sendWelcomeEmail, notifyAdminNewUser } from "@/lib/email"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type")
  const source = searchParams.get("source") // 'login' | 'signup' (Google OAuth)
  const roleParam = searchParams.get("role")
  // Set during signup/login when the user came from a listing's "Sign Up to
  // Contact" button. Only students are sent back to the listing.
  const redirectTo = cookies().get("signup_redirect")?.value

  const supabase = createClient()

  // Establish a session. PKCE links (and OAuth) carry ?code=; legacy email
  // templates carry ?token_hash=&type=. Support both.
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

  // Service role for profile + trial tables (RLS-locked).
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: profile } = await service
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle()

  // SCENARIO 1: Google login with no account → reject and send to signup.
  // (OAuth profiles are only created by this callback — see migration 029 —
  // so an absent profile here genuinely means "never signed up".)
  if (source === "login" && !profile) {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/signup?error=no_account`)
  }

  // SCENARIOS 2 & 3: profile exists (login or signup) → normal login.
  if (profile) {
    return redirectByRole(profile.role, origin, redirectTo)
  }

  // SCENARIO 4: Google signup, new user → create profile (+ trial for landlords/agents).
  if (source === "signup") {
    // Only student/landlord/agent may be self-selected; never an admin role.
    const userRole =
      (roleParam === "landlord" || roleParam === "agent" ? roleParam : "student") as "student" | "landlord" | "agent"
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name || "User"

    const { error: insertError } = await service.from("profiles").insert({
      id: user.id,
      email: user.email,
      full_name: fullName,
      phone: "",
      role: userRole,
      created_at: new Date().toISOString(),
    })
    
    if (insertError) {
      console.error("[AUTH CALLBACK] Profile insert failed:", insertError)
    } else {
      // Background notifications for new signups.
      if (user.email) {
        await sendWelcomeEmail({ email: user.email, fullName, role: userRole })
        await notifyAdminNewUser(fullName, user.email, userRole)
      }
    }

    if (userRole === "landlord" || userRole === "agent") {
      // Google provides no phone — dedupe the trial by email.
      await grantTrialToNewUser(service, user.id, undefined, user.email ?? undefined)
    }

    return redirectByRole(userRole, origin, redirectTo)
  }

  // FALLBACK: email-verification flow (no source param) where the trigger
  // didn't create the profile. Provision from sign-up metadata.
  const meta = user.user_metadata ?? {}
  const userRole = (meta.role || "student") as "student" | "landlord" | "agent"
  const fullName = meta.full_name || "User"

  const { error: insertError } = await service.from("profiles").insert({
    id: user.id,
    email: user.email,
    full_name: fullName,
    phone: meta.phone || "",
    role: userRole,
    created_at: new Date().toISOString(),
  })

  if (insertError) {
    console.error("[AUTH CALLBACK] Profile insert failed:", insertError)
  } else {
    // Background notifications for new signups.
    if (user.email) {
      await sendWelcomeEmail({ email: user.email, fullName, role: userRole })
      await notifyAdminNewUser(fullName, user.email, userRole)
    }
  }

  if (userRole === "landlord" || userRole === "agent") {
    await grantTrialToNewUser(service, user.id, meta.phone || undefined, user.email ?? undefined)
  }

  return redirectByRole(userRole, origin, redirectTo)
}

function redirectByRole(role: string, origin: string, redirectTo?: string) {
  let target: string
  switch (role) {
    case "landlord":
    case "agent":
      target = "/landlord/dashboard"
      break
    case "admin":
    case "super_admin":
      target = "/admin/listings"
      break
    case "student":
    default:
      // Students go back to the listing they came from, if any.
      target = redirectTo && redirectTo.startsWith("/") ? redirectTo : "/browse"
  }

  const res = NextResponse.redirect(`${origin}${target}`)
  // One-shot: clear the redirect cookie so it doesn't leak into later sessions.
  if (redirectTo) res.cookies.set("signup_redirect", "", { path: "/", maxAge: 0 })
  return res
}
