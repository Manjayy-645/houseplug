"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { BadgeCheck, User, MessageCircle, Info, Home, Eye, X, MapPin, Sparkles, Phone, ShieldCheck, AlertCircle, ArrowRight, Share2, Check, Building, Zap } from "lucide-react"
import { buildGeneralRoommateWhatsAppLink } from "@/lib/roommate-matching"

type RoommateProfile = {
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
  target_listing_id?: string | null
  target_listing_title?: string | null
  profile: {
    full_name: string
    avatar_url: string
    verification_status: string
  }
}

export function RoommateCard({
  data,
  currentUserId,
  currentUserRole,
  matchScore,
}: {
  data: RoommateProfile
  currentUserId?: string | null
  currentUserRole?: string | null
  matchScore?: number | null
}) {
  const [showGuestModal, setShowGuestModal] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const firstName = data.profile?.full_name?.split(' ')[0] || "Student"
  const initial = (firstName[0] || "S").toUpperCase()
  const showAvatar = Boolean(data.profile?.avatar_url && !imageError)

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    const url = `${window.location.origin}/roommates/${data.id}`;
    const name = firstName
    const shareText = data.intent === "have_room"
      ? `Check out ${name}'s roommate profile on HousePlug — they have a room available! 🏠`
      : `Check out ${name}'s roommate profile on HousePlug — wanna team up? 🤝`
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${name}'s Roommate Profile — HousePlug`,
          text: shareText,
          url: url,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const isVerified = data.profile?.verification_status === "verified"

  const handleConnect = () => {
    // Case 1: not logged in at all
    if (!currentUserId) {
      setShowGuestModal(true)
      return
    }

    // Case 2: logged in but not a student
    if (currentUserRole !== "student") {
      setShowRoleModal(true)
      return
    }

    // Case 3: verified student — open WhatsApp with smart pre-filled message
    const waUrl = buildGeneralRoommateWhatsAppLink({
      phone: data.phone_number,
      candidateName: data.profile?.full_name || "there",
      targetLodgeTitle: data.target_listing_title,
      targetLodgeId: data.target_listing_id,
      campusName: data.university,
    })
    window.open(waUrl, "_blank")
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 w-full max-w-full box-border">
      {/* Top Banner indicating Intent */}
      <div className={`px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white flex justify-between items-center shrink-0 ${data.intent === 'have_room' ? 'bg-[#F59E0B]' : 'bg-[#1B4332]'}`}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {data.intent === 'have_room' ? (
            <span className="flex items-center gap-1.5 shrink-0"><Home className="h-4 w-4 shrink-0" /> Has a Room</span>
          ) : (
            <span className="flex items-center gap-1.5 shrink-0"><User className="h-4 w-4 shrink-0" /> Looking to Team Up</span>
          )}
          {matchScore !== undefined && matchScore !== null && (
            <span className="bg-white/20 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
              <Zap className="w-2.5 h-2.5 text-yellow-300 shrink-0" /> {matchScore}% Match
            </span>
          )}
        </div>
        <button onClick={handleShare} className="hover:opacity-80 transition-opacity p-1.5 bg-white/20 rounded-full min-h-[30px] min-w-[30px] flex items-center justify-center shrink-0" aria-label="Share">
          {copied ? <Check className="h-3 w-3" /> : <Share2 className="h-3 w-3" />}
        </button>
      </div>

      <div className="p-5 sm:p-6 flex-1 flex flex-col min-w-0">
        {/* User Info Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <div
              style={{
                width: "52px",
                height: "52px",
                minWidth: "52px",
                minHeight: "52px",
                maxWidth: "52px",
                maxHeight: "52px",
                borderRadius: "9999px",
              }}
              className="relative shrink-0 overflow-hidden rounded-full border-2 border-gray-100 bg-[#1B4332] shadow-xs select-none"
            >
              {showAvatar ? (
                <img
                  src={data.profile.avatar_url}
                  alt={data.profile.full_name || "Student"}
                  width={52}
                  height={52}
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: "52px",
                    height: "52px",
                    minWidth: "52px",
                    minHeight: "52px",
                    maxWidth: "52px",
                    maxHeight: "52px",
                    borderRadius: "9999px",
                    objectFit: "cover",
                    display: "block",
                  }}
                  onError={() => setImageError(true)}
                />
              ) : (
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    minWidth: "52px",
                    minHeight: "52px",
                    borderRadius: "9999px",
                  }}
                  className="flex items-center justify-center bg-[#1B4332] text-white font-black text-lg select-none"
                >
                  {initial}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-1.5 truncate">
                <span className="truncate">{firstName}</span>
                {isVerified && <BadgeCheck className="h-5 w-5 text-emerald-500 shrink-0" />}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{data.gender} • {data.university}</p>
            </div>
          </div>
        </div>

        {/* Target Lodge Attachment Pill if present */}
        {data.target_listing_title && (
          <div className="mb-4 rounded-xl border border-amber-200/90 bg-amber-50/70 p-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-7 h-7 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
                <Building className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold text-amber-800 uppercase tracking-wider">
                  Splitting Lodge
                </p>
                <p className="text-xs font-black text-amber-950 truncate">
                  {data.target_listing_title}
                </p>
              </div>
            </div>
            {data.target_listing_id && (
              <Link
                href={`/listing/${data.target_listing_id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] font-bold text-[#1B4332] bg-white border border-amber-200 px-2 py-1 rounded-md hover:bg-gray-50 shrink-0"
              >
                View
              </Link>
            )}
          </div>
        )}

        {/* Budget */}
        <div className="mb-4">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Budget / Rent Share</p>
          <p className="font-black text-[#1B4332] text-xl">
            ₦{data.budget_min.toLocaleString()} - ₦{data.budget_max.toLocaleString()}<span className="text-sm font-medium text-gray-500">/yr</span>
          </p>
        </div>

        {/* Bio */}
        <div className="mb-6 flex-1">
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
            &ldquo;{data.bio}&rdquo;
          </p>
        </div>

        {/* Lifestyle Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(data.lifestyle_tags || []).slice(0, 3).map((tag, i) => (
            <span key={i} className="px-3 py-1 rounded-full bg-gray-50 border border-gray-100 text-xs font-medium text-gray-600">
              {tag}
            </span>
          ))}
          {(data.lifestyle_tags || []).length > 3 && (
            <span className="px-3 py-1 rounded-full bg-gray-50 border border-gray-100 text-xs font-medium text-gray-400">
              +{(data.lifestyle_tags || []).length - 3} more
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            href={`/roommates/${data.id}`}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-bold text-gray-700 transition-all hover:bg-gray-50 active:scale-95 flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            <Eye className="h-4 w-4 text-gray-500" />
            View Details
          </Link>
          <button
            onClick={handleConnect}
            className="flex-1 rounded-xl bg-[#1B4332] px-3 py-3 text-sm font-bold text-white transition-all hover:bg-[#143326] active:scale-95 flex items-center justify-center gap-1.5 shadow-sm min-h-[44px]"
          >
            <MessageCircle className="h-4 w-4 text-[#F59E0B]" />
            WhatsApp
          </button>
        </div>
      </div>

      {/* ── Guest Modal (not logged in) ── */}
      {mounted && showGuestModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative text-center">
            <button
              onClick={() => setShowGuestModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto h-16 w-16 bg-[#1B4332]/10 rounded-full flex items-center justify-center mb-5">
              <Info className="h-8 w-8 text-[#1B4332]" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Sign in to View & Connect</h3>
            <p className="text-gray-500 text-sm mb-8">
              To protect our users&apos; privacy, you must be logged in to view roommate details. Only registered students can contact roommates.
              Create a free account to get started.
            </p>
            <div className="flex flex-col gap-3">
              <a
                href="/signup"
                className="w-full flex items-center justify-center gap-2 bg-[#F59E0B] text-white py-3.5 rounded-xl font-bold hover:brightness-105 transition shadow-sm shadow-amber-400/20"
              >
                Create Free Account <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="/login"
                className="w-full bg-[#1B4332] text-white py-3 rounded-xl font-bold hover:brightness-110 transition"
              >
                Log In
              </a>
              <button
                onClick={() => setShowGuestModal(false)}
                className="w-full py-3 text-gray-400 font-semibold hover:bg-gray-50 rounded-xl transition-colors text-sm"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Role Error Modal (logged in but not a student) ── */}
      {mounted && showRoleModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative text-center">
            <button
              onClick={() => setShowRoleModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mb-5">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Students Only</h3>
            <p className="text-gray-500 text-sm mb-3">
              This feature is exclusively for <span className="font-bold text-gray-700">student accounts</span>.
              Roommate matching is a student-to-student experience on HousePlug.
            </p>
            <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-8">
              <p className="text-red-700 text-xs font-semibold">
                Your current account type does not have permission to contact roommate listings.
                If you&apos;re a student, please sign up with a student account.
              </p>
            </div>
            <button
              onClick={() => setShowRoleModal(false)}
              className="w-full py-3 rounded-xl border border-gray-200 font-bold text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
