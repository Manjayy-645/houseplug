"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AvatarUpload } from "@/components/profile/avatar-upload"
import { MarketingCardPreview } from "@/components/landlord/marketing-card-preview"
import { Mail, Phone, Calendar, Shield, ShieldCheck, Loader2, Pencil } from "lucide-react"
import { formatDate } from "@/lib/utils"

const phoneRegex = /^(070|080|081|090)\d{8}$/

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
  const [editingPhone, setEditingPhone] = useState(false)
  const [phoneInput, setPhoneInput] = useState("")
  const [savingPhone, setSavingPhone] = useState(false)
  const [phoneError, setPhoneError] = useState("")
  const router = useRouter()

  // Deep-link from the dashboard "Add Number" banner: ?edit=phone opens the
  // phone field straight into edit mode.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("edit") === "phone") setEditingPhone(true)
  }, [])

  async function handleSavePhone() {
    if (!userId) return
    const value = phoneInput.trim()
    if (!phoneRegex.test(value)) {
      setPhoneError("Enter a valid Nigerian phone number (e.g. 080XXXXXXXX)")
      return
    }
    setPhoneError("")
    setSavingPhone(true)
    const supabase = createClient()
    const { error } = await supabase.from("profiles").update({ phone: value }).eq("id", userId)
    setSavingPhone(false)
    if (error) {
      setPhoneError(error.message)
      return
    }
    setProfile({ ...profile, phone: value })
    setEditingPhone(false)
  }


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

        <div className="mt-8 max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg shadow-gray-200/50">
          <div className="bg-gradient-to-r from-[#1B4332] to-[#10B981] h-32 relative">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] bg-[size:20px_20px]" />
          </div>
          <div className="px-6 sm:px-8 pb-8">
            <div className="-mt-16 flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 relative z-10">
              {/* Avatar upload replaces static avatar */}
              <div className="bg-white p-1.5 rounded-2xl shadow-xl w-fit">
                <AvatarUpload
                  currentAvatarUrl={profile.avatar_url}
                  userId={userId}
                  fullName={profile.full_name}
                  onUploadComplete={(url) => setProfile({ ...profile, avatar_url: url })}
                />
              </div>
              <div className="mb-2 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-3xl font-black text-gray-900">{profile.full_name}</h2>
                  {profile.verification_status === "verified" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#10B981]/10 px-2.5 py-0.5 text-xs font-bold text-[#10B981] uppercase tracking-wide">
                      <ShieldCheck className="h-3.5 w-3.5" /> Verified
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm font-semibold text-[#1B4332] uppercase tracking-widest flex items-center gap-1.5">
                  <Shield className="h-4 w-4" /> {profile.role}
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-1.5 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-[#F59E0B]" /> Email Address
                </label>
                <p className="text-sm font-medium text-gray-900">{profile.email}</p>
              </div>

              <div className="space-y-1.5 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-[#F59E0B]" /> Phone Number
                </label>
                {editingPhone ? (
                  <div className="space-y-2 mt-1">
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSavePhone()}
                      placeholder="080XXXXXXXX"
                      autoFocus
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                    />
                    {phoneError && <p className="text-xs font-medium text-red-500">{phoneError}</p>}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSavePhone}
                        disabled={savingPhone}
                        className="flex items-center gap-1.5 rounded-lg bg-[#1B4332] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#143728] disabled:opacity-50 transition"
                      >
                        {savingPhone ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingPhone(false)
                          setPhoneError("")
                        }}
                        disabled={savingPhone}
                        className="rounded-lg px-4 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-200 disabled:opacity-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{profile.phone || "Not provided"}</p>
                    <button
                      onClick={() => {
                        setPhoneInput(profile.phone || "")
                        setPhoneError("")
                        setEditingPhone(true)
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-[#F59E0B]/10 px-3 py-1 text-xs font-bold text-[#F59E0B] hover:bg-[#F59E0B]/20 transition"
                    >
                      <Pencil className="h-3 w-3" />
                      {profile.phone ? "Edit" : "Add"}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-[#F59E0B]" /> Joined Date
                </label>
                <p className="text-sm font-medium text-gray-900">{formatDate(profile.created_at)}</p>
              </div>

              <div className="space-y-1.5 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#F59E0B]" /> Status
                </label>
                {profile.verification_status === "verified" ? (
                  <p className="text-sm font-bold text-[#10B981]">
                    Verified
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
