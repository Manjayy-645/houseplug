"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronLeft, Mail, Eye, EyeOff, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { GoogleIcon } from "@/components/auth/google-icon"
import { safeReturnPath } from "@/lib/safe-return"

type LoginStep = "email" | "password"

export default function LoginPage() {
  const supabase = createClient()

  const [step, setStep] = useState<LoginStep>("email")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [redirect, setRedirect] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const requested = params.get("redirect") || params.get("redirectTo")
    setRedirect(requested ? safeReturnPath(requested, "/student/dashboard") : null)
  }, [])

  async function handleGoogleLogin() {
    setError("")
    // Persist the destination so the callback (server-side) can honour it for
    // students after OAuth.
    if (redirect) document.cookie = `signup_redirect=${encodeURIComponent(redirect)}; path=/; max-age=3600; SameSite=Lax`
    // New Google users are created directly via the signup flow; existing users
    // simply log in and redirect by role.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?source=login` },
    })
    if (error) setError("Failed to sign in with Google. Try again.")
  }

  async function handleEmailContinue() {
    if (!email || !email.includes("@")) {
      setError("Enter a valid email address")
      return
    }
    setError("")
    setEmail(email.trim().toLowerCase())
    setStep("password")
  }


  async function handleLogin() {
    setLoading(true)
    setError("")

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      if (error.message.includes("Email not confirmed")) {
        setError("Please verify your email first. Check your inbox.")
      } else if (error.message.includes("Invalid login")) {
        setError("Email or password is incorrect. Try again or reset your password.")
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single()

    const role = profile?.role || "student"

    // Students may have come from a listing's "Sign Up to Contact" button.
    const storedRedirect = typeof window !== "undefined" ? window.localStorage.getItem("signup_redirect") : null
    const destination = safeReturnPath(redirect || storedRedirect, "/student/dashboard")
    if (typeof window !== "undefined") window.localStorage.removeItem("signup_redirect")

    if (role === "landlord" || role === "agent") {
      window.location.href = "/landlord/dashboard"
    } else if (role === "admin" || role === "super_admin") {
      window.location.href = "/admin/listings"
    } else {
      window.location.href = destination
    }
  }

  // STEP 1 — EMAIL
  if (step === "email") {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
        <p className="text-sm text-gray-500 mt-1">Log in to your account</p>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all mt-6"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleEmailContinue()}
          placeholder="Enter your email"
          autoFocus
          className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
        />
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

        <button
          onClick={handleEmailContinue}
          disabled={loading}
          className="w-full bg-[#1B4332] text-white rounded-xl py-3.5 font-semibold text-sm mt-3 hover:bg-[#143728] transition-all disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Continue...
            </span>
          ) : (
            "Continue"
          )}
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account?{" "}
          <Link href={redirect ? `/signup?redirect=${encodeURIComponent(redirect)}` : "/signup"} className="text-[#1B4332] font-semibold">
            Sign up
          </Link>
        </p>
      </div>
    )
  }

  // STEP 2 — PASSWORD
  return (
    <div>
      <button
        onClick={() => {
          setStep("email")
          setError("")
        }}
        className="flex items-center gap-1 text-sm text-gray-500 mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3 mb-6">
        <Mail className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-600 truncate">{email}</span>
        <button onClick={() => setStep("email")} className="ml-auto text-xs text-[#1B4332] font-medium shrink-0">
          Change
        </button>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">Enter your password</h1>

      <div className="relative mt-6">
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          placeholder="Your password"
          autoFocus
          className="w-full rounded-xl border border-gray-200 px-4 py-3.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      <div className="mt-2 text-right">
        <Link href="/forgot-password" className="text-xs text-[#1B4332] font-medium">
          Forgot password?
        </Link>
      </div>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full bg-[#1B4332] text-white rounded-xl py-3.5 font-semibold text-sm mt-4 disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Logging in...
          </span>
        ) : (
          "Log In"
        )}
      </button>
    </div>
  )
}
