"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { AlertCircle } from "lucide-react"
import { redirectByRole } from "@/lib/auth"
import { GoogleIcon } from "@/components/auth/google-icon"

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required")
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [authError, setAuthError] = useState<string | null>(null)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendStatus, setResendStatus] = useState<string | null>(null)

  const supabase = createClient()

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting }
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  })

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const onSubmit = async (values: LoginValues) => {
    setAuthError(null)
    setNeedsVerification(false)

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password
    })

    if (error) {
      if (error.message.includes("Email not confirmed")) {
        setNeedsVerification(true)
        setAuthError("Please check your email and click the verification link before logging in.")
        return
      }
      setAuthError("Invalid email or password")
      return
    }

    if (authData.user) {
      await handlePostLoginRedirect(authData.user)
    }
  }

  const handlePostLoginRedirect = async (user: any) => {
    // Prefer the DB role; fall back to auth metadata if the profile is missing.
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    const role = profile?.role || user.user_metadata?.role || "student"
    redirectByRole(role)
  }

  async function handleGoogleLogin() {
    setAuthError(null)
    // Use the signup flow so a brand-new Google user is created directly
    // (default student role) instead of being rejected. Existing users still
    // just log in and redirect by their stored role.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?source=signup`
      }
    })
    if (error) {
      console.error('Google sign-in error:', error)
      setAuthError('Failed to sign in with Google. Try again.')
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    const email = getValues("email")
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    })
    if (error) {
      setAuthError(error.message)
    } else {
      setResendStatus("Verification email sent!")
      setResendCooldown(60)
      setTimeout(() => setResendStatus(null), 3000)
    }
  }

  return (
    <div>
      <h2 className="mb-5 text-xl font-semibold text-gray-900">Welcome back</h2>

      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium">or log in with email</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {needsVerification && (
        <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col gap-3">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm font-medium text-amber-800 leading-relaxed">
              {authError}
            </p>
          </div>
          <div>
            {resendStatus ? (
              <span className="text-xs font-bold text-emerald-600">{resendStatus}</span>
            ) : (
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="text-xs font-bold text-[#F59E0B] hover:underline disabled:opacity-50"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend verification email"}
              </button>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/20"
          />
          {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email.message}</p> : null}
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <Link href="/forgot-password" title="Reset your password" className="text-xs font-medium text-[#1B4332] hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/20"
          />
          {errors.password ? (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          ) : null}
        </div>

        {authError && !needsVerification ? (
          <p className="text-sm text-red-600 font-medium">{authError}</p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-[#1B4332] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>

        <p className="text-center text-sm text-gray-600">
          New here?{" "}
          <Link href="/signup" className="font-medium text-[#1B4332] hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  )
}
