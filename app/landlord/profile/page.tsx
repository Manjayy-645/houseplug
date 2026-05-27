"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AvatarUpload } from "@/components/profile/avatar-upload"
import { MarketingCardPreview } from "@/components/landlord/marketing-card-preview"
import { Mail, Phone, Calendar, Shield, ShieldCheck } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default function LandlordProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [stats, setStats] = useState({
    activeCount: 0,
    avgRating: 0,
    reviewCount: 0,
    universities: [] as string[],
    primaryArea: "Port Harcourt",
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }

      setUserId(user.id)

      let { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (prof && !prof.username) {
        const { data: generatedUsername } = await supabase.rpc("generate_username", { full_name: prof.full_name })
        if (generatedUsername) {
          await supabase.from("profiles").update({ username: generatedUsername }).eq("id", user.id)
          prof = { ...prof, username: generatedUsername }
        }
      }

      setProfile(prof)

      const [
        { data: activeListings, count: activeCount },
        { data: reviews }
      ] = await Promise.all([
        supabase
          .from("listings")
          .select("university, area", { count: "exact" })
          .eq("landlord_id", user.id)
          .eq("status", "active"),
        supabase
          .from("reviews")
          .select("rating, listing:listings!inner(landlord_id)")
          .eq("listing.landlord_id", user.id),
      ])

      const listings = activeListings ?? []
      const primaryArea = listings.length > 0 ? listings[listings.length - 1].area : "Port Harcourt"
      const universities = Array.from(new Set(listings.map((l: any) => l.university).filter(Boolean))) as string[]

      let avgRating = 0
      let reviewCount = 0
      if (reviews && reviews.length > 0) {
        reviewCount = reviews.length
        avgRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewCount
      }

      setStats({ activeCount: activeCount ?? 0, avgRating, reviewCount, universities, primaryArea })
      setLoading(false)
    }

    fetchData()
  }, [router])

  if (loading) {
    return (
      <div className="p-10 flex justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#1B4332] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!profile || !userId) return null

  return (
    <div className="p-6 lg:p-10 space-y-12">
      {/* Marketing Card Section */}
      <section>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Shareable Card</h1>
          <p className="mt-1 text-sm text-gray-500">
            Share this card in WhatsApp groups to attract students to your listings
          </p>
        </div>

        <div className="mt-8">
          <MarketingCardPreview
            profile={profile}
            activeListingsCount={stats.activeCount}
            avgRating={stats.avgRating}
            reviewCount={stats.reviewCount}
            universities={stats.universities}
            primaryArea={stats.primaryArea}
          />
        </div>
      </section>

      {/* Profile Info Section */}
      <section>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
          <p className="mt-1 text-sm text-gray-500">Manage your personal information.</p>
        </div>

        <div className="mt-8 max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="bg-[#1B4332] h-32" />
          <div className="px-8 pb-8">
            <div className="-mt-12 flex items-end gap-6">
              {/* Avatar upload replaces static avatar */}
              <div className="bg-white p-1 rounded-2xl shadow-lg">
                <AvatarUpload
                  currentAvatarUrl={profile.avatar_url}
                  userId={userId}
                  fullName={profile.full_name}
                  onUploadComplete={(url) => setProfile({ ...profile, avatar_url: url })}
                />
              </div>
              <div className="mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{profile.full_name}</h2>
                <p className="text-sm text-gray-500 capitalize">{profile.role}</p>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <Mail className="h-3 w-3" /> Email Address
                </label>
                <p className="text-sm font-medium text-gray-900">{profile.email}</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <Phone className="h-3 w-3" /> Phone Number
                </label>
                <p className="text-sm font-medium text-gray-900">{profile.phone || "Not provided"}</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <Calendar className="h-3 w-3" /> Joined Date
                </label>
                <p className="text-sm font-medium text-gray-900">{formatDate(profile.created_at)}</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <Shield className="h-3 w-3" /> Account Status
                </label>
                {profile.verification_status === "verified" ? (
                  <p className="text-sm font-medium text-green-600 flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4" /> Verified Landlord
                  </p>
                ) : (
                  <p className="text-sm font-medium text-gray-500 capitalize">
                    {profile.verification_status || "Unverified"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
