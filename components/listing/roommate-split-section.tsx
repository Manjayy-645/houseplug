"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { createPortal } from "react-dom"
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
  MessageCircle,
  Zap,
  X,
  ShieldCheck,
  Loader2,
  AlertCircle,
  CheckCheck,
} from "lucide-react"
import { formatNaira } from "@/lib/utils"
import { UNIVERSITIES } from "@/lib/constants"
import { fireCelebrationConfetti } from "@/lib/confetti"
import {
  computeComprehensiveMatchScore,
  isBudgetCompatibleWithLodge,
  buildLodgeRoommateWhatsAppLink,
  formatWhatsAppPhone,
} from "@/lib/roommate-matching"
import {
  attachListingToRoommateProfile,
  removeListingFromRoommateProfile,
} from "@/app/roommate-actions"
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
  user_id?: string
  intent: string
  university: string
  budget_min: number
  budget_max: number
  gender: string
  preferred_gender: string
  lifestyle_tags?: string[] | null
  bio?: string | null
  phone_number?: string
  room_address?: string | null
  target_listing_id?: string | null
  target_listing_title?: string | null
  profile?: {
    id?: string
    full_name: string
    avatar_url: string | null
    verification_status: string
  } | null
}

interface RoommateSplitSectionProps {
  listing: Listing
  campusRoommates?: CampusRoommate[]
  currentUserId?: string | null
  currentUserRole?: string | null
  currentUserRoommateProfile?: {
    id: string
    university: string
    budget_min: number
    budget_max: number
    gender: string
    preferred_gender: string
    lifestyle_tags: string[]
    target_listing_id?: string | null
    target_listing_title?: string | null
    room_address?: string | null
  } | null
}

export function RoommateSplitSection({
  listing,
  campusRoommates = [],
  currentUserId,
  currentUserRole,
  currentUserRoommateProfile,
}: RoommateSplitSectionProps) {
  const [splitCount, setSplitCount] = useState<2 | 3>(2)
  const [copied, setCopied] = useState(false)
  const [showGuestModal, setShowGuestModal] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [isAttaching, setIsAttaching] = useState(false)
  const [isDetaching, setIsDetaching] = useState(false)
  const [isAttachedLocal, setIsAttachedLocal] = useState<boolean | null>(null)

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

  const isUserAttached =
    isAttachedLocal !== null
      ? isAttachedLocal
      : currentUserRoommateProfile?.target_listing_id === listing.id

  // Pre-formatted invite text for general WhatsApp share
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

  // Handle One-Click "I Want to Split This Lodge"
  const handleToggleAttachLodge = async () => {
    if (!currentUserId) {
      setShowGuestModal(true)
      return
    }
    if (currentUserRole !== "student") {
      setShowRoleModal(true)
      return
    }

    if (isUserAttached) {
      setIsDetaching(true)
      try {
        await removeListingFromRoommateProfile(listing.id)
        setIsAttachedLocal(false)
      } catch (err) {
        console.error(err)
      } finally {
        setIsDetaching(false)
      }
    } else {
      setIsAttaching(true)
      try {
        const res = await attachListingToRoommateProfile({
          listingId: listing.id,
          listingTitle: listing.title,
          university: campusName,
          area: listing.area,
          priceYearly: listing.price_yearly,
        })
        if (res.success) {
          setIsAttachedLocal(true)
          fireCelebrationConfetti()
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsAttaching(false)
      }
    }
  }

  // Handle Direct WhatsApp Connect on Roommate Card
  const handleConnectRoommate = (roommate: CampusRoommate) => {
    if (!currentUserId) {
      setShowGuestModal(true)
      return
    }
    if (currentUserRole !== "student") {
      setShowRoleModal(true)
      return
    }

    const phone = roommate.phone_number || ""
    if (!phone) {
      window.location.href = `/roommates/${roommate.id}`
      return
    }

    const waUrl = buildLodgeRoommateWhatsAppLink({
      phone,
      candidateName: roommate.profile?.full_name || "there",
      listingTitle: listing.title,
      listingArea: listing.area,
      campusName,
      listingId: listing.id,
      splitPrice,
      splitCount,
    })

    window.open(waUrl, "_blank")
  }

  // Compute and rank compatible roommates
  const scoredRoommates = useMemo(() => {
    return campusRoommates
      .map((r) => {
        let matchScore: number | null = null
        let matchReasons: string[] = []

        if (currentUserRoommateProfile) {
          const res = computeComprehensiveMatchScore(currentUserRoommateProfile, r, {
            id: listing.id,
            title: listing.title,
            area: listing.area,
            price_yearly: listing.price_yearly,
          })
          if (res.isEligible) {
            matchScore = res.score
            matchReasons = res.reasons
          }
        }

        const budgetInfo = isBudgetCompatibleWithLodge(r.budget_min, r.budget_max, splitPrice)

        const isExplicitLodgeTarget =
          r.target_listing_id === listing.id ||
          (r.target_listing_title &&
            r.target_listing_title.toLowerCase().includes(listing.title.toLowerCase()))

        return {
          ...r,
          matchScore,
          matchReasons,
          budgetInfo,
          isExplicitLodgeTarget,
        }
      })
      .sort((a, b) => {
        // Priority 1: explicitly targeting this lodge
        if (a.isExplicitLodgeTarget && !b.isExplicitLodgeTarget) return -1
        if (!a.isExplicitLodgeTarget && b.isExplicitLodgeTarget) return 1
        // Priority 2: pairwise match score
        if (a.matchScore !== null && b.matchScore !== null) {
          return b.matchScore - a.matchScore
        }
        // Priority 3: exact budget compatibility
        if (a.budgetInfo.isExact && !b.budgetInfo.isExact) return -1
        if (!a.budgetInfo.isExact && b.budgetInfo.isExact) return 1
        return 0
      })
  }, [campusRoommates, currentUserRoommateProfile, listing, splitPrice])

  return (
    <>
      <section
        id="split-rent-section"
        className="scroll-mt-24 sm:scroll-mt-28 rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50/80 via-white to-amber-50/50 p-4 sm:p-7 lg:p-8 shadow-sm transition-all relative overflow-hidden"
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
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span>Rent too high?</span>
              <span className="text-[#1B4332]">Split the rent!</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1 max-w-xl leading-relaxed">
              You don&apos;t have to pay {formatNaira(listing.price_yearly)} alone. Pair up with a
              fellow {campusName} student, share this lodge, and save big on accommodation.
            </p>
          </div>

          {/* Roommate count switcher - tap friendly */}
          <div className="flex items-center bg-gray-100/90 p-1 rounded-2xl border border-gray-200 self-start sm:self-auto shrink-0 w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={() => setSplitCount(2)}
              className={`flex-1 sm:flex-initial px-4 py-2.5 sm:py-1.5 rounded-xl text-xs font-black transition-all text-center min-h-[40px] sm:min-h-0 flex items-center justify-center ${
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
              className={`flex-1 sm:flex-initial px-4 py-2.5 sm:py-1.5 rounded-xl text-xs font-black transition-all text-center min-h-[40px] sm:min-h-0 flex items-center justify-center ${
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
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4 mb-6">
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
          <div className="rounded-2xl border-2 border-[#1B4332] bg-[#1B4332] text-white p-4 sm:p-5 shadow-md md:col-span-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-left sm:text-right shrink-0 w-full sm:w-auto">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 block">
                Annual Student Savings
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-400">
                +{formatNaira(savings)}
              </span>
              <span className="text-[11px] text-emerald-100 block mt-0.5">kept in your pocket</span>
            </div>
          </div>
        </div>

        {/* One-Click Student Lodge Split Attachment Banner */}
        {currentUserRoommateProfile ? (
          <div className="relative z-10 mb-6 rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  isUserAttached ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-800"
                }`}
              >
                {isUserAttached ? <CheckCheck className="w-5 h-5" /> : <Zap className="w-5 h-5 text-[#F59E0B]" />}
              </div>
              <div>
                <p className="text-xs font-extrabold text-gray-900">
                  {isUserAttached
                    ? "You're actively listed as seeking a roommate for this lodge!"
                    : "Have a roommate profile? Attach this lodge in 1-tap"}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                  {isUserAttached
                    ? "Other students looking to split rent in this area will see your profile highlighted."
                    : "Signal to other students that you're ready to team up on this specific accommodation."}
                </p>
              </div>
            </div>

            <div className="w-full sm:w-auto shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleAttachLodge}
                disabled={isAttaching || isDetaching}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 shadow-sm min-h-[42px] ${
                  isUserAttached
                    ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                    : "bg-[#1B4332] text-white hover:bg-[#143326]"
                }`}
              >
                {isAttaching || isDetaching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isUserAttached ? (
                  <>
                    <X className="w-3.5 h-3.5 text-gray-500" />
                    <span>Remove My Interest</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>I Want to Split This Lodge</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : null}

        {/* Action Channels: WhatsApp Share vs Post Request */}
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
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-white font-extrabold text-xs py-3 px-3 rounded-xl transition-all shadow-sm min-h-[44px]"
              >
                <WhatsAppIcon className="w-4 h-4 fill-white shrink-0" />
                <span>Invite on WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={handleCopyLink}
                title="Copy invite text"
                aria-label="Copy invite text"
                className="p-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
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
                className="w-full inline-flex items-center justify-center gap-2 bg-[#1B4332] hover:bg-[#143326] active:scale-[0.98] text-white font-extrabold text-xs py-3 px-3 rounded-xl transition-all shadow-sm min-h-[44px]"
              >
                <Users className="w-4 h-4 text-[#F59E0B] shrink-0" />
                <span>Post Request For This Lodge</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Live Compatible Roommates Strip */}
        <div className="relative z-10 border-t border-emerald-900/10 pt-5">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-[#1B4332]" />
              <h4 className="text-xs sm:text-sm font-bold text-gray-800">
                Compatible Roommates Near {campusName}
              </h4>
            </div>
            <Link
              href={`/roommates?q=${encodeURIComponent(campusName)}`}
              className="text-xs font-bold text-[#1B4332] hover:underline inline-flex items-center gap-1 min-h-[36px] items-center"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {scoredRoommates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {scoredRoommates.map((roommate) => {
                const displayName = roommate.profile?.full_name || "Verified Student"
                const avatar = roommate.profile?.avatar_url
                const isVerified = roommate.profile?.verification_status === "verified"

                return (
                  <div
                    key={roommate.id}
                    className="group rounded-2xl border border-gray-200/90 bg-white p-4 hover:border-[#1B4332] hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header: Avatar & Match Badge */}
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <Link
                          href={`/roommates/${roommate.id}`}
                          className="flex items-center gap-2.5 min-w-0 flex-1 group-hover:opacity-95"
                        >
                          <div className="w-10 h-10 min-w-[40px] min-h-[40px] max-w-[40px] max-h-[40px] rounded-full overflow-hidden ring-1 ring-gray-200 shrink-0 relative bg-gray-50">
                            {avatar ? (
                              <img
                                src={avatar}
                                alt={displayName}
                                className="w-full h-full object-cover rounded-full aspect-square block"
                              />
                            ) : (
                              <div className="w-full h-full bg-[#1B4332] text-white flex items-center justify-center font-bold text-xs">
                                {displayName.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-gray-900 truncate flex items-center gap-1">
                              <span className="truncate">{displayName}</span>
                              {isVerified && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100 shrink-0" />
                              )}
                            </p>
                            <p className="text-[10px] text-gray-500 font-medium capitalize truncate">
                              {roommate.gender || "Student"} •{" "}
                              {roommate.intent === "have_room" ? "Has Room" : "Looking to team up"}
                            </p>
                          </div>
                        </Link>

                        {/* Match or Target badge */}
                        {roommate.isExplicitLodgeTarget ? (
                          <span className="shrink-0 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
                            <Building className="w-2.5 h-2.5" /> Wants this lodge
                          </span>
                        ) : roommate.matchScore !== null ? (
                          <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-200">
                            <Zap className="w-3 h-3 text-[#F59E0B]" /> {roommate.matchScore}% Match
                          </span>
                        ) : (
                          <span className="shrink-0 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            {roommate.budgetInfo.isExact ? "Budget Match" : "Active"}
                          </span>
                        )}
                      </div>

                      {/* Budget Fit pill */}
                      <div className="bg-emerald-50/70 border border-emerald-100/80 rounded-xl p-2.5 text-center mb-2.5">
                        <span className="text-[9px] text-emerald-900/70 font-bold block uppercase tracking-wider">
                          Roommate Budget
                        </span>
                        <span className="text-xs font-black text-[#1B4332]">
                          {formatNaira(roommate.budget_min)} – {formatNaira(roommate.budget_max)}
                        </span>
                      </div>

                      {/* Lifestyle tags */}
                      {roommate.lifestyle_tags && roommate.lifestyle_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {roommate.lifestyle_tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-[9px] bg-gray-100 text-gray-700 font-semibold px-2 py-0.5 rounded-md"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Pre-filled WhatsApp CTA Button - Touch Friendly */}
                    <div className="space-y-1.5 pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => handleConnectRoommate(roommate)}
                        className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-white font-extrabold text-xs py-2.5 px-3 rounded-xl transition-all shadow-xs min-h-[42px]"
                      >
                        <WhatsAppIcon className="w-4 h-4 fill-white shrink-0" />
                        <span>Chat on WhatsApp</span>
                      </button>

                      <Link
                        href={`/roommates/${roommate.id}`}
                        className="w-full text-center text-[11px] font-bold text-gray-500 hover:text-[#1B4332] transition-colors py-1 block"
                      >
                        View Full Profile →
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-emerald-300/60 bg-white/70 p-5 text-center">
              <p className="text-xs text-gray-600 font-medium mb-3">
                No roommate requests posted for <strong>{campusName}</strong> yet today.
              </p>
              <Link
                href={createRoommateUrl}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B4332] bg-emerald-100/70 hover:bg-emerald-100 px-4 py-2.5 rounded-full transition-colors min-h-[40px]"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#1B4332]" />
                <span>Be the first to post a request for {campusName}</span>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Guest Sign-In Gate Modal (Mobile & Desktop) */}
      {showGuestModal && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl overflow-hidden p-6 sm:p-7 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#1B4332] flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGuestModal(false)}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 min-h-[40px] min-w-[40px] flex items-center justify-center"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <h3 className="text-lg font-black text-gray-900 mb-1.5">
                  Sign in with your Student Account
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-6 leading-relaxed">
                  To protect student phone numbers from spam and ensure safety, WhatsApp contact is
                  reserved for verified student accounts.
                </p>

                <div className="space-y-2.5">
                  <Link
                    href={`/login?next=${encodeURIComponent(`/listing/${listing.id}#split-rent-section`)}`}
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#1B4332] text-white font-extrabold text-sm py-3.5 px-4 rounded-xl hover:bg-[#143326] transition-all min-h-[44px]"
                  >
                    Log In as Student
                  </Link>
                  <Link
                    href={`/signup?next=${encodeURIComponent(`/listing/${listing.id}#split-rent-section`)}`}
                    className="w-full inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-800 font-extrabold text-sm py-3.5 px-4 rounded-xl hover:bg-gray-200 transition-all min-h-[44px]"
                  >
                    Create Free Account
                  </Link>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}

      {/* Role Notice Modal (If logged in as landlord/agent) */}
      {showRoleModal && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl overflow-hidden p-6 sm:p-7 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRoleModal(false)}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 min-h-[40px] min-w-[40px] flex items-center justify-center"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <h3 className="text-lg font-black text-gray-900 mb-1.5">Students Only</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-6 leading-relaxed">
                  The roommate connection feature is exclusively available to verified student
                  accounts.
                </p>

                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="w-full inline-flex items-center justify-center bg-gray-100 text-gray-800 font-extrabold text-sm py-3 px-4 rounded-xl hover:bg-gray-200 transition-all min-h-[44px]"
                >
                  Got it
                </button>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  )
}
