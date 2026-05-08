"use client"

import Link from "next/link"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react"

const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email")
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema)
  })

  const onSubmit = async (values: ForgotPasswordValues) => {
    setError(null)
    const supabase = createClient()
    
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setIsSubmitted(true)
    }
  }

  if (isSubmitted) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-gray-900">Check your email</h2>
        <p className="mb-6 text-sm text-gray-600">
          We've sent a password reset link to your email address.
        </p>
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#1B4332] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-2 text-xl font-bold text-gray-900">Reset your password</h2>
      <p className="mb-6 text-sm text-gray-600">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Mail className="h-4 w-4 text-gray-400" />
            </div>
            <input
              id="email"
              type="email"
              {...register("email")}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/20"
              placeholder="name@example.com"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-[#1B4332] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2D5A47] disabled:opacity-60"
        >
          {isSubmitting ? "Sending link..." : "Send reset link"}
        </button>

        <div className="text-center">
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#1B4332] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </div>
      </form>
    </div>
  )
}
