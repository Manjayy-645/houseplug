"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Wrench, ShieldCheck, Sparkles, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { MyCampusService } from "@/components/services/my-campus-service"
import type { Profile } from "@/types"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { NEW_PAYMENTS_AVAILABLE } from "@/lib/payment-availability"

export default function ManageServicesPage() {
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login?redirect=/services/manage")
        return
      }
      setUser(user)
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()

      setProfile(data)
      setLoading(false)
    })
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] pt-24 pb-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-3 border-[#1B4332] border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-gray-500">Opening service manager...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#F9FAFB] pt-16 sm:pt-20 pb-16 sm:pb-20">
      <div className="max-w-4xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#1B4332] py-1 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Campus Services
          </Link>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-4 sm:p-8 shadow-xs">
          <div className="space-y-1 sm:space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#1B4332] text-[11px] sm:text-xs font-bold uppercase tracking-wider">
              <Wrench className="w-3.5 h-3.5 text-[#F59E0B]" /> Campus Provider Hub
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Manage Your Service
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              Manage your service profile, renew your monthly listing, and boost visibility to students across Port Harcourt campuses.
            </p>
          </div>
        </div>

        {/* Service Manager Component */}
        {!NEW_PAYMENTS_AVAILABLE && (
          <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            New paid service listings and boosts are temporarily unavailable. You can still manage an existing service profile.
          </div>
        )}
        <MyCampusService userId={user.id} defaultPhone={profile?.phone || ""} />
      </div>
    </div>
  )
}
