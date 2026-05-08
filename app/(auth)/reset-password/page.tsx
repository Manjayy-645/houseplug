"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { Lock, CheckCircle2, Loader2 } from "lucide-react"

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
})

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(true)
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema)
  })

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      
      // Supabase handles the #access_token=... from the URL automatically 
      // when createClient is called and it initializes.
      // We just need to check if a session exists now.
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        // If no session, it might be because the fragment hasn't been processed yet
        // or the link is invalid. Let's wait a tiny bit or check the hash.
        if (!window.location.hash.includes("access_token")) {
          setError("Your password reset link is invalid or has expired.")
        }
      }
      
      setIsValidating(false)
    }

    checkSession()
  }, [])

  const onSubmit = async (values: ResetPasswordValues) => {
    setError(null)
    const supabase = createClient()
    
    const { error } = await supabase.auth.updateUser({
      password: values.password
    })

    if (error) {
      setError(error.message)
    } else {
      setIsSuccess(true)
      // Log out to ensure they have to log in with new password
      await supabase.auth.signOut()
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    }
  }

  if (isValidating) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B4332]" />
        <p className="mt-4 text-sm text-gray-600">Verifying reset link...</p>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-gray-900">Password updated</h2>
        <p className="text-sm text-gray-600">
          Your password has been reset successfully. Redirecting you to login...
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-2 text-xl font-bold text-gray-900">Create new password</h2>
      <p className="mb-6 text-sm text-gray-600">
        Please enter a strong password that you haven't used before.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
            New Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Lock className="h-4 w-4 text-gray-400" />
            </div>
            <input
              id="password"
              type="password"
              {...register("password")}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/20"
              placeholder="••••••••"
            />
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-gray-700">
            Confirm New Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Lock className="h-4 w-4 text-gray-400" />
            </div>
            <input
              id="confirmPassword"
              type="password"
              {...register("confirmPassword")}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/20"
              placeholder="••••••••"
            />
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
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
          {isSubmitting ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  )
}
