"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { Mail, ArrowLeft } from "lucide-react"

const signupSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  phone: z
    .string()
    .regex(/^(070|080|081|090)\d{8}$/, "Enter a valid Nigerian phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["student", "landlord"])
})

type SignupValues = z.infer<typeof signupSchema>

export default function SignupPage() {
  const [formState, setFormState] = useState<'form' | 'verify'>('form')
  const [authEmail, setEmail] = useState("")
  const [authError, setAuthError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendStatus, setResendStatus] = useState<string | null>(null)

  const supabase = createClient()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      password: "",
      role: "student"
    }
  })

  const selectedRole = watch("role")

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const onSubmit = async (values: SignupValues) => {
    setAuthError(null)
    const { data: authData, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.full_name,
          phone: values.phone,
          role: values.role
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      if (error.message.toLowerCase().includes("email")) {
        setAuthError("This email is already in use or invalid.")
      } else {
        setAuthError(error.message)
      }
      return
    }

    if (authData.user) {
      setEmail(values.email)
      setFormState('verify')
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: authEmail,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    })

    if (error) {
      setAuthError(error.message)
    } else {
      setResendStatus("Verification email resent!")
      setResendCooldown(60)
      setTimeout(() => setResendStatus(null), 3000)
    }
  }

  if (formState === 'verify') {
    return (
      <div className="text-center py-4">
        <div className="flex justify-center mb-6">
          <div className="bg-emerald-50 p-4 rounded-full">
            <Mail className="h-10 w-10 text-[#1B4332]" />
          </div>
        </div>

        <h2 className="text-2xl font-black text-gray-900 mb-2">Check your email</h2>
        <p className="text-gray-500 font-medium mb-2">
          We sent a verification link to:
        </p>
        <p className="text-[#1B4332] font-black mb-6 break-all">{authEmail}</p>

        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 mb-8">
          <p className="text-sm text-gray-600 leading-relaxed">
            Click the link in that email to verify your account. You&apos;ll be
            signed in and taken to your dashboard automatically.
          </p>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600 font-medium">
            Didn&apos;t receive the email?{" "}
            {resendStatus ? (
              <span className="text-emerald-600 font-bold">{resendStatus}</span>
            ) : (
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="text-[#F59E0B] font-black hover:underline disabled:opacity-50"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend verification email"}
              </button>
            )}
          </p>

          {authError && <p className="text-sm font-bold text-red-600">{authError}</p>}

          <button
            onClick={() => setFormState('form')}
            className="flex items-center justify-center gap-2 mx-auto text-sm font-bold text-gray-400 hover:text-gray-600 transition"
          >
            <ArrowLeft className="h-4 w-4" /> Use a different email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-5 text-xl font-semibold text-gray-900">Create your account</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="full_name" className="mb-1 block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            id="full_name"
            type="text"
            {...register("full_name")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/20"
          />
          {errors.full_name ? (
            <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>
          ) : null}
        </div>

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
          <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input
            id="phone"
            type="text"
            placeholder="080xxxxxxxx"
            {...register("phone")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/20"
          />
          {errors.phone ? <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p> : null}
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register("password")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/20"
          />
          {errors.password ? (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          ) : null}
        </div>

        <div>
          <p className="mb-2 block text-sm font-medium text-gray-700">I am a:</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setValue("role", "student", { shouldValidate: true })}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                selectedRole === "student"
                  ? "border-[#1B4332] bg-[#1B4332] text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:border-[#1B4332]"
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setValue("role", "landlord", { shouldValidate: true })}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                selectedRole === "landlord"
                  ? "border-[#1B4332] bg-[#1B4332] text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:border-[#1B4332]"
              }`}
            >
              Landlord
            </button>
          </div>
          {errors.role ? <p className="mt-1 text-xs text-red-600">{errors.role.message}</p> : null}
        </div>

        {authError ? <p className="text-sm text-red-600">{authError}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-[#1B4332] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </button>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[#1B4332] hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  )
}
