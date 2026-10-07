"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { BadgeCheck, User, MessageCircle, Info, Home, Eye, X, MapPin, Sparkles, Phone, ShieldCheck, AlertCircle, ArrowRight, Share2, Check } from "lucide-react"

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
}: {
  data: RoommateProfile
  currentUserId?: string | null
  currentUserRole?: string | null
}) {
  const [showGuestModal, setShowGuestModal] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    const url = `${window.location.origin}/roommates/${data.id}`;
    const name = data.profile?.full_name?.split(' ')[0] || "this student"
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

    // Case 3: verified student — open WhatsApp
    let phone = data.phone_number
    if (phone.startsWith("0")) {
      phone = "234" + phone.substring(1)
    } else if (!phone.startsWith("234")) {
      phone = "234" + phone
    }

    const name = data.profile?.full_name?.split(" ")[0] || "there"
    const message = encodeURIComponent(`Hi ${name}, I saw your roommate profile on HousePlug!`)
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank")
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
      {/* Top Banner indicating Intent */}
      <div className={`px-4 py-2 text-xs font-black uppercase tracking-widest text-white flex justify-between items-center ${data.intent === 'have_room' ? 'bg-[#F59E0B]' : 'bg-[#1B4332]'}`}>
        {data.intent === 'have_room' ? (
          <span className="flex items-center gap-2"><Home className="h-4 w-4" /> Has a Room</span>
        ) : (
          <span className="flex items-center gap-2"><User className="h-4 w-4" /> Looking to Team Up</span>
        )}
        <button onClick={handleShare} className="hover:opacity-80 transition-opacity p-1 bg-white/20 rounded-full" aria-label="Share">
          {copied ? <Check className="h-3 w-3" /> : <Share2 className="h-3 w-3" />}
        </button>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        {/* User Info Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-gray-100 bg-gray-50 shrink-0">
              {data.profile?.avatar_url ? (
                <img src={data.profile.avatar_url} alt={data.profile.full_name || "User"} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400">
                  <User className="h-6 w-6" />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-1.5">
                {data.profile?.full_name?.split(' ')[0] || "Student"}
                {isVerified && <BadgeCheck className="h-5 w-5 text-emerald-500" />}
              </h3>
              <p className="text-sm text-gray-500">{data.gender} • {data.university}</p>
            </div>
          </div>
        </div>

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
            className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-bold text-gray-700 transition-all hover:bg-gray-50 active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Eye className="h-4 w-4 text-gray-500" />
            View Details
          </Link>
          <button
            onClick={handleConnect}
            className="flex-1 rounded-xl bg-[#1B4332] px-3 py-3 text-sm font-bold text-white transition-all hover:bg-[#143326] active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
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
