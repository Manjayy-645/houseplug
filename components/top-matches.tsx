"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { createPortal } from "react-dom"
import { fireCelebrationConfetti } from "@/lib/confetti"
import {
  Sparkles,
  User,
  BadgeCheck,
  Home,
  MessageCircle,
  X,
  Phone,
  ShieldCheck,
  MapPin,
  Zap,
  Loader2,
} from "lucide-react"

type RoommateMatch = {
  id: string
  intent: "have_room" | "teaming_up"
  university: string
  budget_min: number
  budget_max: number
  gender: string
  preferred_gender: string
  lifestyle_tags: string[]
  bio: string
  phone_number: string
  room_photos: string[]
  room_address: string
  matchScore: number
  profile: {
    full_name: string
    avatar_url: string
    verification_status: string
  }
}

function computeMatchScore(
  mine: { budget_min: number; budget_max: number; lifestyle_tags: string[] },
  theirs: { budget_min: number; budget_max: number; lifestyle_tags: string[] }
): number {
  const overlapMin = Math.max(mine.budget_min, theirs.budget_min)
  const overlapMax = Math.min(mine.budget_max, theirs.budget_max)
  const myRange = mine.budget_max - mine.budget_min || 1
  const budgetScore = overlapMax >= overlapMin
    ? Math.min(50, Math.round(((overlapMax - overlapMin) / myRange) * 50))
    : 0

  const myTags = new Set<string>((mine.lifestyle_tags || []).map((t: string) => t.toLowerCase()))
  const theirTags = (theirs.lifestyle_tags || []).map((t: string) => t.toLowerCase())
  const sharedTags = theirTags.filter((t: string) => myTags.has(t)).length
  const tagScore = myTags.size > 0 ? Math.round((sharedTags / myTags.size) * 50) : 0

  return Math.min(100, budgetScore + tagScore)
}

function MatchModal({
  match,
  onClose,
  currentUserId,
}: {
  match: RoommateMatch
  onClose: () => void
  currentUserId: string
}) {
  const isVerified = match.profile?.verification_status === "verified"

  const handleConnect = () => {
    let phone = match.phone_number
    if (phone.startsWith("0")) phone = "234" + phone.substring(1)
    else if (!phone.startsWith("234")) phone = "234" + phone
    const name = match.profile?.full_name?.split(" ")[0] || "there"
    const message = encodeURIComponent(
      `Hi ${name}, I saw your roommate profile on HousePlug and I think we're a great match! 🔌`
    )
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank")
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className={`px-6 py-4 flex items-center justify-between text-white ${match.intent === "have_room" ? "bg-[#F59E0B]" : "bg-[#1B4332]"}`}>
          <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
            {match.intent === "have_room" ? <><Home className="h-4 w-4" /> Has a Room</> : <><User className="h-4 w-4" /> Looking to Team Up</>}
          </span>
          <div className="flex items-center gap-3">
            <span className="bg-white/20 text-white text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1">
              <Zap className="h-3 w-3 text-yellow-300" /> {match.matchScore}% Match
            </span>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 transition-colors" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="flex items-center gap-4 border-b border-gray-100 pb-5">
            <div
              style={{
                width: "60px",
                height: "60px",
                minWidth: "60px",
                minHeight: "60px",
                maxWidth: "60px",
                maxHeight: "60px",
                borderRadius: "9999px",
              }}
              className="relative shrink-0 overflow-hidden rounded-full border-2 border-[#1B4332]/10 bg-[#1B4332] shadow-xs select-none"
            >
              {match.profile?.avatar_url ? (
                <img
                  src={match.profile.avatar_url}
                  alt={match.profile.full_name || "Student"}
                  width={60}
                  height={60}
                  style={{
                    width: "60px",
                    height: "60px",
                    minWidth: "60px",
                    minHeight: "60px",
                    maxWidth: "60px",
                    maxHeight: "60px",
                    borderRadius: "9999px",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    minWidth: "60px",
                    minHeight: "60px",
                    borderRadius: "9999px",
                  }}
                  className="flex items-center justify-center bg-[#1B4332] text-white font-black text-xl uppercase"
                >
                  {(match.profile?.full_name?.split(" ")[0]?.[0] || "S").toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h2 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                {match.profile?.full_name || "Student"}
                {isVerified && <BadgeCheck className="h-5 w-5 text-emerald-500" />}
              </h2>
              <p className="text-sm text-gray-500 font-medium">{match.gender} • {match.university}</p>
              {isVerified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
                  <ShieldCheck className="h-3 w-3" /> Verified Student
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Budget / Rent Share</p>
              <p className="font-black text-[#1B4332] text-lg">
                ₦{match.budget_min.toLocaleString()} - ₦{match.budget_max.toLocaleString()}
                <span className="text-xs text-gray-500 font-normal">/yr</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Preferred Roommate</p>
              <p className="font-bold text-gray-800 text-sm capitalize mt-1">
                {match.preferred_gender === "any" ? "Any Gender" : `${match.preferred_gender} Only`}
              </p>
            </div>
          </div>

          {match.intent === "have_room" && match.room_address && (
            <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-100">
              <p className="text-xs text-amber-800 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <MapPin className="h-3.5 w-3.5 text-amber-600" /> Room Address / Location
              </p>
              <p className="text-sm font-semibold text-gray-800">{match.room_address}</p>
            </div>
          )}

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-[#F59E0B]" /> About Me
            </h4>
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">"{match.bio}"</p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Lifestyle & Preferences</h4>
            <div className="flex flex-wrap gap-2">
              {(match.lifestyle_tags || []).map((tag, i) => (
                <span key={i} className="px-3.5 py-1.5 rounded-xl bg-gray-100 text-xs font-semibold text-gray-700">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
          <button onClick={onClose} className="w-1/3 py-3 rounded-xl border border-gray-200 font-bold text-sm text-gray-600 hover:bg-gray-100 transition-colors">
            Close
          </button>
          <button
            onClick={handleConnect}
            className="w-2/3 py-3 rounded-xl bg-[#1B4332] text-white font-bold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-md"
          >
            <Phone className="h-4 w-4 text-[#F59E0B]" /> Connect on WhatsApp
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export function TopMatches({ myProfile }: { myProfile: any }) {
  const [matches, setMatches] = useState<RoommateMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState<RoommateMatch | null>(null)
  const [mounted, setMounted] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [celebratedOnce, setCelebratedOnce] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchMatches = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data, error } = await supabase
      .from("roommate_profiles")
      .select("*")
      .eq("status", "active")
      .eq("university", myProfile.university)
      .neq("user_id", user.id)

    if (error || !data) { setLoading(false); return }

    let loadedMatches = data
    if (data.length > 0) {
      const uids = data.map((d: any) => d.user_id)
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, verification_status")
        .in("id", uids)
      if (profs) {
        loadedMatches = data.map((d: any) => ({
          ...d,
          profile: profs.find((p: any) => p.id === d.user_id) || null
        }))
      }
    }

    const filtered = loadedMatches.filter((p: any) => {
      const theyWantMe =
        p.preferred_gender === "any" ||
        p.preferred_gender.toLowerCase() === myProfile.gender.toLowerCase()
      const iWantThem =
        myProfile.preferred_gender === "any" ||
        myProfile.preferred_gender.toLowerCase() === p.gender.toLowerCase()
      return theyWantMe && iWantThem
    })

    const scored: RoommateMatch[] = filtered
      .map((p: any) => ({
        ...p,
        matchScore: computeMatchScore(
          { budget_min: myProfile.budget_min, budget_max: myProfile.budget_max, lifestyle_tags: myProfile.lifestyle_tags || [] },
          { budget_min: p.budget_min, budget_max: p.budget_max, lifestyle_tags: p.lifestyle_tags || [] }
        ),
      }))
      .sort((a: RoommateMatch, b: RoommateMatch) => b.matchScore - a.matchScore)
      .slice(0, 3)

    setMatches(scored)
    setLoading(false)

    if (!celebratedOnce && scored.length > 0 && scored[0].matchScore >= 60) {
      setTimeout(() => fireCelebrationConfetti(), 500)
      setCelebratedOnce(true)
    }
  }, [myProfile, celebratedOnce])

  useEffect(() => {
    fetchMatches()
  }, [fetchMatches])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-4 w-4 text-[#F59E0B]" />
          <h2 className="font-bold text-gray-900 text-sm">Top Matches For You</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[#1B4332]/40" />
        </div>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-[#F59E0B]" />
          <h2 className="font-bold text-gray-900 text-sm">Top Matches For You</h2>
        </div>
        <p className="text-sm text-gray-400 text-center py-6">
          No matches yet — check back as more students from {myProfile.university} join! 🙏
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-50 rounded-lg">
              <Sparkles className="h-4 w-4 text-[#F59E0B]" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Top Matches For You</h2>
              <p className="text-[11px] text-gray-400">Based on your budget, university & lifestyle</p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-[#1B4332] bg-emerald-50 px-2.5 py-1 rounded-full">
            {matches.length} found
          </span>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
          {matches.map((match) => {
            const isVerified = match.profile?.verification_status === "verified"
            const score = match.matchScore
            const scoreColor =
              score >= 80 ? "text-emerald-700 bg-emerald-50 border-emerald-100" :
              score >= 60 ? "text-amber-700 bg-amber-50 border-amber-100" :
              "text-gray-600 bg-gray-50 border-gray-100"

            return (
              <button
                key={match.id}
                onClick={() => setSelectedMatch(match)}
                className="snap-start shrink-0 w-52 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-left hover:border-[#1B4332]/30 hover:shadow-md transition-all group active:scale-95 cursor-pointer"
              >
                <div className={`inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full border mb-3 ${scoreColor}`}>
                  <Zap className="h-3 w-3" />
                  {score}% Match
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      minWidth: "40px",
                      minHeight: "40px",
                      maxWidth: "40px",
                      maxHeight: "40px",
                      borderRadius: "9999px",
                    }}
                    className="relative shrink-0 overflow-hidden rounded-full border-2 border-white shadow-xs bg-[#1B4332] select-none"
                  >
                    {match.profile?.avatar_url ? (
                      <img
                        src={match.profile.avatar_url}
                        alt={match.profile.full_name || "Student"}
                        width={40}
                        height={40}
                        style={{
                          width: "40px",
                          height: "40px",
                          minWidth: "40px",
                          minHeight: "40px",
                          maxWidth: "40px",
                          maxHeight: "40px",
                          borderRadius: "9999px",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          minWidth: "40px",
                          minHeight: "40px",
                          borderRadius: "9999px",
                        }}
                        className="flex items-center justify-center bg-[#1B4332] text-white font-black text-sm uppercase"
                      >
                        {(match.profile?.full_name?.split(" ")[0]?.[0] || "S").toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate flex items-center gap-1">
                      {match.profile?.full_name?.split(" ")[0] || "Student"}
                      {isVerified && <BadgeCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">{match.gender} • {match.university}</p>
                  </div>
                </div>

                <div className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg mb-3 flex items-center gap-1 w-fit ${match.intent === "have_room" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                  {match.intent === "have_room" ? <><Home className="h-3 w-3" /> Has a Room</> : <><User className="h-3 w-3" /> Teaming Up</>}
                </div>

                <p className="text-xs font-black text-[#1B4332]">
                  ₦{match.budget_min.toLocaleString()} – ₦{match.budget_max.toLocaleString()}
                  <span className="text-gray-400 font-normal">/yr</span>
                </p>

                {match.lifestyle_tags?.slice(0, 2).length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-2">
                    {match.lifestyle_tags.slice(0, 2).map((tag, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500">{tag}</span>
                    ))}
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-1 text-[#1B4332] text-xs font-bold group-hover:gap-2 transition-all">
                  <MessageCircle className="h-3.5 w-3.5" />
                  View Profile
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {mounted && selectedMatch && (
        <MatchModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
          currentUserId={userId || ""}
        />
      )}
    </>
  )
}
