"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { GraduationCap, Home, ChevronLeft, Mail, Eye, EyeOff, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { GoogleIcon } from "@/components/auth/google-icon"

type SignupStep = "role" | "method" | "details" | "confirm"
type Role = "student" | "landlord" | "agent"

const stepOrder: SignupStep[] = ["role", "method", "details"]
const phoneRegex = /^(070|080|081|090)\d{8}$/

function ProgressDots({ step }: { step: SignupStep }) {
  if (step === "confirm") return null
  const currentIndex = stepOrder.indexOf(step)
  return (
    <div className="mb-6 flex items-center justify-center gap-2">
      {stepOrder.map((s, i) => (
        <span
          key={s}
          className={`h-2 rounded-full transition-all ${
            i === currentIndex ? "w-6 bg-[#1B4332]" : i < currentIndex ? "w-2 bg-[#1B4332]" : "w-2 bg-gray-200"
          }`}
        />
      ))}
    </div>
  )
}

export default function SignupPage() {
  const supabase = createClient()

  const [step, setStep] = useState<SignupStep>("role")
  const [primaryRole, setPrimaryRole] = useState<"student" | "property_owner" | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [resendCooldown, setResendCooldown] = useState(0)
  const [redirect, setRedirect] = useState("/browse")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setRedirect(params.get("redirect") || "/browse")
  }, [])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  // Persist the post-auth destination so it survives the OAuth / email-link
  // round trips (cookie is read server-side by the callback; localStorage is
  // read client-side by the login redirect).
  function persistRedirect() {
    if (typeof document !== "undefined") {
      document.cookie = `signup_redirect=${redirect}; path=/; max-age=3600`
      window.localStorage.setItem("signup_redirect", redirect)
    }
  }

  async function handleGoogleSignUp() {
    if (!selectedRole) return
    setError("")
    persistRedirect()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?source=signup&role=${selectedRole}`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    })
    if (error) setError("Failed to sign in with Google. Try again.")
  }

  async function handleCreateAccount() {
    setError("")
    if (fullName.trim().length < 2) {
      setError("Enter your full name")
      return
    }
    if (!phoneRegex.test(phone)) {
      setError("Enter a valid Nigerian phone number (e.g. 080XXXXXXXX)")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone, role: selectedRole },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setLoading(false)

    if (error) {
      setError(error.message.toLowerCase().includes("already") ? "This email is already in use." : error.message)
      return
    }
    persistRedirect()
    setStep("confirm")
  }

  async function handleResend() {
    if (resendCooldown > 0) return
    await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setResendCooldown(60)
  }

  // STEP 4 — CONFIRM
  if (step === "confirm") {
    return (
      <div className="flex flex-col items-center text-center py-6">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-6">
          <Mail className="w-8 h-8 text-[#1B4332]" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
        <p className="text-sm text-gray-500 mt-2 max-w-xs">
          We sent a verification link to{" "}
          <span className="font-semibold text-gray-700">{email}</span>. Click it to activate your account.
        </p>
        <p className="text-xs text-gray-400 mt-8">Didn&apos;t receive it?</p>
        <button
          onClick={handleResend}
          disabled={resendCooldown > 0}
          className="text-sm text-[#1B4332] font-semibold mt-1 disabled:text-gray-400"
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend email"}
        </button>
      </div>
    )
  }

  return (
    <div>
      <ProgressDots step={step} />

      {/* STEP 1 — ROLE */}
      {step === "role" && (
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Join HousePlug</h1>
          <p className="text-sm text-gray-500 mt-1">Who are you?</p>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              onClick={() => {
                setPrimaryRole("student")
                setSelectedRole("student")
                setStep("method")
              }}
              className="flex flex-col items-center gap-3 rounded-2xl border-2 border-gray-200 p-6 hover:border-[#1B4332] hover:bg-[#1B4332]/5 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900">Student</p>
                <p className="text-xs text-gray-500 mt-0.5">Looking for housing</p>
              </div>
            </button>

            <button
              onClick={() => {
                setPrimaryRole("property_owner")
                setSelectedRole(null)
              }}
              className={`flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-all ${
                primaryRole === "property_owner"
                  ? "border-[#1B4332] bg-[#1B4332]/5"
                  : "border-gray-200 hover:border-[#1B4332] hover:bg-[#1B4332]/5"
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                <Home className="w-6 h-6 text-[#1B4332]" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900">Property Owner</p>
                <p className="text-xs text-gray-500 mt-0.5">List a property</p>
              </div>
            </button>
          </div>

          {primaryRole === "property_owner" && (
            <>
              <div className="mt-3 grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                <button
                  onClick={() => setSelectedRole("landlord")}
                  className={`rounded-xl border-2 py-3 text-sm font-semibold transition-all ${
                    selectedRole === "landlord"
                      ? "border-[#1B4332] bg-[#1B4332]/5 text-[#1B4332]"
                      : "border-gray-200 text-gray-500"
                  }`}
                >
                  Landlord
                  <p className="text-xs font-normal mt-0.5">I own the property</p>
                </button>
                <button
                  onClick={() => setSelectedRole("agent")}
                  className={`rounded-xl border-2 py-3 text-sm font-semibold transition-all ${
                    selectedRole === "agent"
                      ? "border-[#1B4332] bg-[#1B4332]/5 text-[#1B4332]"
                      : "border-gray-200 text-gray-500"
                  }`}
                >
                  Agent
                  <p className="text-xs font-normal mt-0.5">I manage properties</p>
                </button>
              </div>

              <button
                onClick={() => setStep("method")}
                disabled={!selectedRole}
                className="w-full mt-4 bg-[#1B4332] text-white rounded-xl py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-[#1B4332] font-semibold">
              Log in
            </Link>
          </p>
        </div>
      )}

      {/* STEP 2 — METHOD */}
      {step === "method" && (
        <div>
          <button
            onClick={() => {
              setStep("role")
              setError("")
            }}
            className="flex items-center gap-1 text-sm text-gray-500 mb-6"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-sm text-gray-500 mt-1">How would you like to sign up?</p>

          <button
            onClick={handleGoogleSignUp}
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

          <div className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && goToDetails()}
              placeholder="Enter your email"
              className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              onClick={goToDetails}
              className="w-full bg-[#1B4332] text-white rounded-xl py-3.5 font-semibold text-sm hover:bg-[#143728] transition-all"
            >
              Continue with Email
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-[#1B4332] font-semibold">
              Log in
            </Link>
          </p>
        </div>
      )}

      {/* STEP 3 — DETAILS */}
      {step === "details" && (
        <div>
          <button
            onClick={() => {
              setStep("method")
              setError("")
            }}
            className="flex items-center gap-1 text-sm text-gray-500 mb-6"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          <h1 className="text-2xl font-bold text-gray-900">Almost there</h1>
          <p className="text-sm text-gray-500 mt-1">Fill in your details to complete signup</p>

          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3 my-4">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 truncate">{email}</span>
            <button onClick={() => setStep("method")} className="ml-auto text-xs text-[#1B4332] font-medium shrink-0">
              Change
            </button>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="080XXXXXXXX"
              className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 8 characters)"
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
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateAccount()}
              placeholder="Confirm password"
              className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              onClick={handleCreateAccount}
              disabled={loading}
              className="w-full bg-[#1B4332] text-white rounded-xl py-3.5 font-semibold text-sm disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )

  function goToDetails() {
    if (!email || !email.includes("@")) {
      setError("Enter a valid email address")
      return
    }
    setError("")
    setStep("details")
  }
}
