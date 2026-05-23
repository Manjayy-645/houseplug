"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"

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
  const router = useRouter()
  const [authError, setAuthError] = useState<string | null>(null)

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

  const onSubmit = async (values: SignupValues) => {
    setAuthError(null)

    const supabase = createClient()
    const { data: authData, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.full_name,
          role: values.role,
          phone: values.phone
        }
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
      // Fallback: create profile directly if trigger didn't
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authData.user.id)
        .single()

      if (!existingProfile) {
        await supabase.from('profiles').insert({
          id: authData.user.id,
          email: authData.user.email!,
          full_name: values.full_name,
          role: values.role,
          phone: values.phone
        })
      }

      // Redirect based on role
      if (values.role === 'landlord') {
        router.push('/landlord/dashboard')
      } else {
        router.push('/browse')
      }
    }
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
