"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import {
  Users,
  CheckCircle2,
  ArrowRight,
  PauseCircle,
  PlayCircle,
  Pencil,
  Loader2,
} from "lucide-react"

export default function StudentRoommatePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/login"); return }
      setUserId(user.id)
      const { data } = await supabase
        .from("roommate_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()
      setProfile(data)
      setLoading(false)
    }
    fetch()
  }, [router])

  async function updateStatus(status: "active" | "paused" | "found") {
    if (!userId) return
    setUpdating(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("roommate_profiles")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .select()
      .single()
    setUpdating(false)
    if (!error && data) setProfile(data)
  }

  if (loading) {
    return (
      <div className="p-10 flex justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#1B4332] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]">Student Dashboard</p>
          <h1 className="text-2xl font-bold text-gray-900">Roommate Profile</h1>
        </div>
        {profile && (
          <Link
            href="/roommates/create"
            className="flex items-center gap-2 text-sm font-bold text-[#1B4332] border border-[#1B4332]/20 px-4 py-2 rounded-xl hover:bg-[#1B4332]/5 transition"
          >
            <Pencil className="h-4 w-4" /> Edit
          </Link>
        )}
      </header>

      {!profile ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="h-16 w-16 bg-[#1B4332]/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-[#1B4332]/40" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No roommate profile yet</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            Create a post so other students can find and contact you.
          </p>
          <Link
            href="/roommates/create"
            className="inline-flex items-center gap-2 bg-[#1B4332] text-white px-6 py-3 rounded-xl font-bold hover:brightness-110 transition"
          >
            Create Profile <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Status card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">Current Status</p>
                <span
                  className={`inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full capitalize ${
                    profile.status === "active"
                      ? "bg-emerald-100 text-emerald-700"
                      : profile.status === "found"
                      ? "bg-gray-100 text-gray-500 line-through"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {profile.status === "active" && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
                  {profile.status === "found" && <CheckCircle2 className="h-4 w-4" />}
                  {profile.status}
                </span>
              </div>
            </div>

            {/* Details */}
            <dl className="grid grid-cols-2 gap-4 text-sm mb-6">
              {[
                { label: "Intent", value: profile.intent === "have_room" ? "Has a Room" : "Looking to Team Up" },
                { label: "University", value: profile.university },
                { label: "Budget", value: `₦${profile.budget_min?.toLocaleString()} – ₦${profile.budget_max?.toLocaleString()}` },
                { label: "Gender", value: profile.gender },
                { label: "Prefers", value: profile.preferred_gender },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{label}</dt>
                  <dd className="font-semibold text-gray-800">{value}</dd>
                </div>
              ))}
            </dl>

            {profile.bio && (
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 mb-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Bio</p>
                <p className="text-sm text-gray-700 leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              {profile.status === "active" && (
                <>
                  <button
                    onClick={() => updateStatus("found")}
                    disabled={updating}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#10B981] text-white py-3 rounded-xl font-bold hover:bg-[#0ea274] transition disabled:opacity-50"
                  >
                    {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Mark as Found ✓
                  </button>
                  <button
                    onClick={() => updateStatus("paused")}
                    disabled={updating}
                    className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    <PauseCircle className="h-4 w-4" /> Pause
                  </button>
                </>
              )}
              {profile.status === "paused" && (
                <button
                  onClick={() => updateStatus("active")}
                  disabled={updating}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#1B4332] text-white py-3 rounded-xl font-bold hover:brightness-110 transition disabled:opacity-50"
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                  Re-activate
                </button>
              )}
              {profile.status === "found" && (
                <button
                  onClick={() => updateStatus("active")}
                  disabled={updating}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#1B4332] text-white py-3 rounded-xl font-bold hover:brightness-110 transition disabled:opacity-50"
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                  Still Looking — Re-activate
                </button>
              )}
            </div>
          </div>

          <Link
            href="/roommates"
            className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:shadow-sm transition"
          >
            <Users className="h-4 w-4" /> Browse All Roommate Posts
          </Link>
        </div>
      )}
    </div>
  )
}
