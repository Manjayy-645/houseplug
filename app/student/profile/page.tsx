"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AvatarUpload } from "@/components/profile/avatar-upload"
import { Mail, Phone, Calendar, ShieldCheck, Shield, Loader2, Pencil, Bell, FileText } from "lucide-react"
import { formatDate } from "@/lib/utils"

const phoneRegex = /^(070|080|081|090)\d{8}$/

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingPhone, setEditingPhone] = useState(false)
  const [phoneInput, setPhoneInput] = useState("")
  const [savingPhone, setSavingPhone] = useState(false)
  const [phoneError, setPhoneError] = useState("")
  const [savingMarketing, setSavingMarketing] = useState(false)
  const router = useRouter()

  async function handleToggleMarketing() {
    if (!userId || savingMarketing) return
    const newValue = !profile.marketing_opt_in
    setSavingMarketing(true)
    const supabase = createClient()
    const { error } = await supabase.from("profiles").update({ marketing_opt_in: newValue }).eq("id", userId)
    setSavingMarketing(false)
    if (!error) {
      setProfile({ ...profile, marketing_opt_in: newValue })
    }
  }

  useEffect(() => {
    const supabase = createClient()
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }
      setUserId(user.id)
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single()
      setProfile(prof)
      setLoading(false)
    }
    fetchData()
  }, [router])

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
    if (error) { setPhoneError(error.message); return }
    setProfile({ ...profile, phone: value })
    setEditingPhone(false)
  }

  if (loading) {
    return (
      <div className="p-10 flex justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#1B4332] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!profile || !userId) return null

  const isVerified = profile.verification_status === "verified"

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <header>
        <p className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]">Student Dashboard</p>
        <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
      </header>

      <div className="max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg shadow-gray-200/50">
        <div className="bg-gradient-to-r from-[#1B4332] to-[#10B981] h-28 relative">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] bg-[size:20px_20px]" />
        </div>
        <div className="px-6 pb-8">
          <div className="-mt-14 flex flex-col sm:flex-row sm:items-end gap-4 relative z-10">
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
                <h2 className="text-2xl font-black text-gray-900">{profile.full_name}</h2>
                {isVerified && (
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

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
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
                      onClick={() => { setEditingPhone(false); setPhoneError("") }}
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
                    onClick={() => { setPhoneInput(profile.phone || ""); setPhoneError(""); setEditingPhone(true) }}
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
                <Calendar className="h-3.5 w-3.5 text-[#F59E0B]" /> Joined
              </label>
              <p className="text-sm font-medium text-gray-900">{formatDate(profile.created_at)}</p>
            </div>

            <div className="space-y-1.5 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-[#F59E0B]" /> Status
              </label>
              <p className={`text-sm font-bold ${isVerified ? "text-[#10B981]" : "text-gray-500"}`}>
                {isVerified ? "Verified" : (profile.verification_status || "Unverified")}
              </p>
            </div>

            <div className="space-y-1.5 p-4 rounded-xl bg-gray-50 border border-gray-100">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-[#F59E0B]" /> Legal Consent
              </label>
              <p className="text-sm font-medium text-gray-900">
                {profile.ndpa_consent_at ? `Agreed on ${formatDate(profile.ndpa_consent_at)}` : "Not explicitly recorded"}
              </p>
            </div>

            <div className="space-y-1.5 p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col justify-between">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Bell className="h-3.5 w-3.5 text-[#F59E0B]" /> Marketing Updates
                </label>
                <p className="text-xs text-gray-500 mt-1">Receive campus housing tips and offers.</p>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">{profile.marketing_opt_in ? "Subscribed" : "Unsubscribed"}</span>
                <button
                  onClick={handleToggleMarketing}
                  disabled={savingMarketing}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:ring-offset-2 disabled:opacity-50 transition-colors ${profile.marketing_opt_in ? 'bg-[#1B4332]' : 'bg-gray-200'}`}
                >
                  <span className="sr-only">Toggle marketing</span>
                  <span aria-hidden="true" className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${profile.marketing_opt_in ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
