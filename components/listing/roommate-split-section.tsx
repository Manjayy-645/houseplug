"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Users,
  Sparkles,
  ArrowRight,
  UserPlus,
  CheckCircle2,
  Copy,
  Check,
  Building,
  HeartHandshake,
  Flame,
  MessageCircle,
} from "lucide-react"
import { formatNaira } from "@/lib/utils"
import { UNIVERSITIES } from "@/lib/constants"
import type { Listing } from "@/types"

const WhatsAppIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.052 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
)

export interface CampusRoommate {
  id: string
  intent: string
  university: string
  budget_min: number
  budget_max: number
  gender: string
  preferred_gender: string
  lifestyle_tags?: string[] | null
  bio?: string | null
  profile?: {
    full_name: string
    avatar_url: string | null
    verification_status: string
  } | null
}

interface RoommateSplitSectionProps {
  listing: Listing
  campusRoommates?: CampusRoommate[]
}

export function RoommateSplitSection({
  listing,
  campusRoommates = [],
}: RoommateSplitSectionProps) {
  const [splitCount, setSplitCount] = useState<2 | 3>(2)
  const [copied, setCopied] = useState(false)

  const campusObj = UNIVERSITIES.find(
    (u) =>
      u.id.toLowerCase() === listing.university.toLowerCase() ||
      u.shortName.toLowerCase() === listing.university.toLowerCase() ||
      u.name.toLowerCase() === listing.university.toLowerCase()
  )
  const campusName = campusObj?.shortName || listing.university

  const splitPrice = Math.round(listing.price_yearly / splitCount)
  const savings = listing.price_yearly - splitPrice
  const monthlyApprox = Math.round(splitPrice / 12)

  // Pre-formatted invite text for WhatsApp
  const shareText = `Hey! I found this lodge on HousePlug: "${listing.title}" in ${listing.area} near ${campusName}. Total rent is ${formatNaira(listing.price_yearly)}/year — if we split it (${splitCount} of us), that's just ${formatNaira(splitPrice)}/year each! Check out photos and details here: https://houseplug.ng/listing/${listing.id}`

  const whatsappInviteUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`

  // Direct link to create a roommate request with pre-filled lodge data
  const createRoommateUrl = `/roommates/create?intent=teaming_up&university=${encodeURIComponent(
    campusObj?.name || listing.university
  )}&budget=${splitPrice}&address=${encodeURIComponent(
    `${listing.title}, ${listing.area}`
  )}&listing_id=${listing.id}&listing_title=${encodeURIComponent(listing.title)}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <section
      id="split-rent-section"
      className="scroll-mt-28 rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50/80 via-white to-amber-50/50 p-6 sm:p-8 shadow-sm transition-all relative overflow-hidden"
    >
      {/* Background ambient decorative shapes */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

      {/* Header Pill & Title */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1B4332] text-white text-xs font-black uppercase tracking-wider mb-2.5 shadow-sm">
            <Users className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Roommate Split Mode</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            Rent too high? <span className="text-[#1B4332]">Split the rent!</span>
          </h2>
          <p className="text-sm sm:text-base text-gray-600 font-medium mt-1 max-w-xl">
            You don&apos;t have to pay {formatNaira(listing.price_yearly)} alone. Pair up with a
            fellow {campusName} student, share this lodge, and save big on accommodation.
          </p>
        </div>

        {/* Roommate count switcher */}
        <div className="flex items-center bg-gray-100/90 p-1 rounded-2xl border border-gray-200 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setSplitCount(2)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              splitCount === 2
                ? "bg-[#1B4332] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            2 People (50/50)
          </button>
          <button
            type="button"
            onClick={() => setSplitCount(3)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              splitCount === 3
                ? "bg-[#1B4332] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            3 People (33% each)
          </button>
        </div>
      </div>

      {/* Calculator Dashboard Card */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Full Price Card */}
        <div className="rounded-2xl border border-gray-200 bg-white/90 p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Paying Alone
          </span>
          <div className="my-2">
            <p className="text-2xl font-black text-gray-400 line-through decoration-red-500/80 decoration-2">
              {formatNaira(listing.price_yearly)}
            </p>
            <p className="text-xs text-gray-500 font-medium">100% full cost on you</p>
          </div>
          <span className="text-[11px] font-semibold text-gray-400">Heavy student burden</span>
        </div>

        {/* Split Price (Highlighted) */}
        <div className="rounded-2xl border-2 border-[#1B4332] bg-[#1B4332] text-white p-4 shadow-md md:col-span-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-amber-300 bg-white/10 px-2.5 py-0.5 rounded-md">
              <Sparkles className="w-3 h-3" />
              Your Cost Split With {splitCount - 1} Person
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                {formatNaira(splitPrice)}
              </p>
              <span className="text-xs font-bold text-emerald-200">/ yr per person</span>
            </div>
            <p className="text-xs text-emerald-100 font-medium mt-0.5">
              Approx. <strong className="text-white">{formatNaira(monthlyApprox)}/month</strong> per
              person
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-center sm:text-right shrink-0 w-full sm:w-auto">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 block">
              Annual Student Savings
            </span>
            <span className="text-lg sm:text-xl font-black text-amber-400">
              +{formatNaira(savings)}
            </span>
            <span className="text-[11px] text-emerald-100 block mt-0.5">kept in your pocket</span>
          </div>
        </div>
      </div>

      {/* Two Action Channels */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8">
        {/* Option 1: WhatsApp Invite A Friend */}
        <div className="rounded-2xl bg-white border border-gray-200/90 p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-full bg-[#25D366]/15 flex items-center justify-center text-[#25D366]">
                <WhatsAppIcon className="w-4 h-4 fill-current" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">
                Have a friend or coursemate in mind?
              </h3>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">
              Send them a ready-to-read WhatsApp message with the photos, details, and the split price.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
            <a
              href={whatsappInviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-white font-extrabold text-xs py-2.5 px-3 rounded-xl transition-all shadow-sm"
            >
              <WhatsAppIcon className="w-4 h-4 fill-white" />
              <span>Invite on WhatsApp</span>
            </a>
            <button
              type="button"
              onClick={handleCopyLink}
              title="Copy invite text"
              className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Option 2: Post Roommate Request */}
        <div className="rounded-2xl bg-white border border-gray-200/90 p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-[#1B4332]">
                <UserPlus className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">
                Need a verified student roommate?
              </h3>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">
              Post a roommate request for this lodge on HousePlug. We&apos;ll pre-fill the budget and
              campus for you!
            </p>
          </div>

          <div className="pt-2 border-t border-gray-50">
            <Link
              href={createRoommateUrl}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#1B4332] hover:bg-[#143326] active:scale-[0.98] text-white font-extrabold text-xs py-2.5 px-3 rounded-xl transition-all shadow-sm"
            >
              <Users className="w-4 h-4 text-[#F59E0B]" />
              <span>Post Request For This Lodge</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Live Campus Roommates Strip */}
      <div className="relative z-10 border-t border-emerald-900/10 pt-5">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-[#1B4332]" />
            <h4 className="text-xs sm:text-sm font-bold text-gray-800">
              Students Looking for Roommates Near {campusName}
            </h4>
          </div>
          <Link
            href={`/roommates?q=${encodeURIComponent(campusName)}`}
            className="text-xs font-bold text-[#1B4332] hover:underline inline-flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {campusRoommates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {campusRoommates.map((roommate) => {
              const displayName = roommate.profile?.full_name || "Verified Student"
              const avatar = roommate.profile?.avatar_url
              const isVerified = roommate.profile?.verification_status === "verified"

              return (
                <Link
                  key={roommate.id}
                  href={`/roommates/${roommate.id}`}
                  className="group rounded-2xl border border-gray-200/80 bg-white p-3.5 hover:border-[#1B4332] hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2.5 mb-2">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={displayName}
                          className="w-9 h-9 rounded-full object-cover ring-1 ring-gray-200 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {displayName.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-900 truncate flex items-center gap-1">
                          {displayName}
                          {isVerified && (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 fill-emerald-100 shrink-0" />
                          )}
                        </p>
                        <p className="text-[10px] text-gray-500 font-medium capitalize">
                          {roommate.gender || "Student"} • {roommate.intent === "have_room" ? "Has Room" : "Looking"}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-2 text-center mb-2">
                      <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">
                        Budget Range
                      </span>
                      <span className="text-xs font-extrabold text-[#1B4332]">
                        {formatNaira(roommate.budget_min)} – {formatNaira(roommate.budget_max)}
                      </span>
                    </div>

                    {roommate.lifestyle_tags && roommate.lifestyle_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {roommate.lifestyle_tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] bg-emerald-50 text-emerald-800 font-semibold px-1.5 py-0.5 rounded-md"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className="text-[11px] font-bold text-[#1B4332] group-hover:underline flex items-center justify-end gap-1 pt-1 border-t border-gray-50">
                    Connect on Profile →
                  </span>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-emerald-300/60 bg-white/70 p-4 text-center">
            <p className="text-xs text-gray-600 font-medium mb-2">
              No roommate requests posted for <strong>{campusName}</strong> yet today.
            </p>
            <Link
              href={createRoommateUrl}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B4332] bg-emerald-100/70 hover:bg-emerald-100 px-3.5 py-1.5 rounded-full transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#1B4332]" />
              <span>Be the first to post a request for {campusName}</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
