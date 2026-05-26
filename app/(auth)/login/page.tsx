"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import type { UserRole } from "@/types"
import { OTPInput } from "@/components/auth/otp-input"
import { AlertCircle, RefreshCw } from "lucide-react"
import { redirectByRole } from "@/lib/auth"

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required")
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [authError, setAuthError] = useState<string | null>(null)
  const [showOtp, setShowOtp] = useState(false)
  const [otp, setOtp] = useState("")
  const [otpLoading, setOtpLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

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

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password
    })

    if (error) {
      if (error.message.includes("Email not confirmed")) {
        setShowOtp(true)
        setAuthError("Please verify your email first. Enter the OTP code we sent you, or check your inbox for the verification link.")
        return
      }
      setAuthError("Invalid email or password")
      return
    }

    if (authData.user) {
      await handlePostLoginRedirect(authData.user)
    }
  }

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return
    setOtpLoading(true)
    
    try {
      const email = getValues("email")
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      })

      if (error) throw error

      if (data.user) {
        await handlePostLoginRedirect(data.user)
      }
    } catch (err: any) {
      setAuthError(err.message || "Invalid or expired code.")
      setOtpLoading(false)
    }
  }

  const handlePostLoginRedirect = async (user: any) => {
    // 1. Try to fetch existing profile role from DB
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    // 2. Determine which role to use for redirection
    // We prioritize the database role (profile.role) over auth metadata
    let targetRole = profile?.role

    // 3. Fallback to metadata role if profile fetch failed or role is missing
    if (!targetRole) {
      targetRole = user.user_metadata?.role ?? 'student'
      
      // If profile is missing entirely, attempt to create it
      if (error?.code === 'PGRST116') {
        console.log("[LOGIN] Profile missing, creating with metadata role:", targetRole)
        await supabase.from('profiles').insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name ?? 'User',
          role: targetRole,
        })
      }
    }

    console.log(`[LOGIN] Redirecting user ${user.email} with role: ${targetRole}`)
    redirectByRole(targetRole)
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    const email = getValues("email")
    await supabase.auth.resend({ type: 'signup', email })
    setResendCooldown(60)
  }

  // Auto-submit OTP
  useEffect(() => {
    if (otp.length === 6) {
      handleVerifyOtp()
    }
  }, [otp])

  return (
    <div>
      <h2 className="mb-5 text-xl font-semibold text-gray-900">Welcome back</h2>
      
      {showOtp && (
        <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col gap-4">
          <div className="flex gap-3">
             <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
             <p className="text-sm font-medium text-amber-800 leading-relaxed">
               {authError}
             </p>
          </div>
          
          <div className="pt-2">
            <OTPInput value={otp} onChange={setOtp} disabled={otpLoading} />
          </div>

          <div className="flex items-center justify-between mt-2">
             <button 
               onClick={handleResend}
               disabled={resendCooldown > 0}
               className="text-xs font-bold text-[#F59E0B] hover:underline disabled:opacity-50"
             >
               {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
             </button>
             <button 
               onClick={() => setShowOtp(false)}
               className="text-xs font-bold text-gray-400 hover:text-gray-600 transition"
             >
               Back to password
             </button>
          </div>
        </div>
      )}

      {!showOtp && (
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

          {authError && !showOtp ? <p className="text-sm text-red-600 font-medium">{authError}</p> : null}

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
      )}

      {showOtp && (
        <button
          onClick={handleVerifyOtp}
          disabled={otp.length !== 6 || otpLoading}
          className="w-full mt-4 rounded-lg bg-[#1B4332] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {otpLoading ? <RefreshCw className="h-5 w-5 animate-spin mx-auto" /> : "Verify & Login"}
        </button>
      )}
    </div>
  )
}
