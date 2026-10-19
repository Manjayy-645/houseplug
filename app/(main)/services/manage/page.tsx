"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Wrench, ShieldCheck, Sparkles, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { MyCampusService } from "@/components/services/my-campus-service"
import type { Profile } from "@/types"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export default function ManageServicesPage() {
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login?redirectTo=/services/manage")
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
    <div className="min-h-screen bg-[#F9FAFB] pt-20 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#1B4332] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Campus Services
          </Link>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#1B4332] text-xs font-bold uppercase tracking-wider">
              <Wrench className="w-3.5 h-3.5 text-[#F59E0B]" /> Campus Provider Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Manage Your Service
            </h1>
            <p className="text-sm text-gray-500">
              Manage your service profile, renew your monthly listing, and boost visibility to students across Port Harcourt campuses.
            </p>
          </div>
        </div>

        {/* Service Manager Component */}
        <MyCampusService userId={user.id} defaultPhone={profile?.phone || ""} />
      </div>
    </div>
  )
}
