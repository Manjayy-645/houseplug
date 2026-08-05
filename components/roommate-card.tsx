"use client"

import { useState } from "react"
import { BadgeCheck, User, MessageCircle, Info, Home } from "lucide-react"

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

export function RoommateCard({ data }: { data: RoommateProfile }) {
  const [showConnectModal, setShowConnectModal] = useState(false)
  const isVerified = data.profile.verification_status === "verified"

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
      {/* Top Banner indicating Intent */}
      <div className={`px-4 py-2 text-xs font-black uppercase tracking-widest text-white ${data.intent === 'have_room' ? 'bg-[#F59E0B]' : 'bg-[#1B4332]'}`}>
        {data.intent === 'have_room' ? (
          <span className="flex items-center gap-2"><Home className="h-4 w-4" /> Has a Room</span>
        ) : (
          <span className="flex items-center gap-2"><User className="h-4 w-4" /> Looking to Team Up</span>
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col">
        {/* User Info Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-gray-100 bg-gray-50 shrink-0">
              {data.profile.avatar_url ? (
                <img src={data.profile.avatar_url} alt={data.profile.full_name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400">
                  <User className="h-6 w-6" />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-1.5">
                {data.profile.full_name.split(' ')[0]} 
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
            "{data.bio}"
          </p>
        </div>

        {/* Lifestyle Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {data.lifestyle_tags.slice(0, 3).map((tag, i) => (
            <span key={i} className="px-3 py-1 rounded-full bg-gray-50 border border-gray-100 text-xs font-medium text-gray-600">
              {tag}
            </span>
          ))}
          {data.lifestyle_tags.length > 3 && (
            <span className="px-3 py-1 rounded-full bg-gray-50 border border-gray-100 text-xs font-medium text-gray-400">
              +{data.lifestyle_tags.length - 3} more
            </span>
          )}
        </div>

        {/* Actions */}
        <button 
          onClick={() => setShowConnectModal(true)}
          className="w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-gray-800 active:scale-95 flex items-center justify-center gap-2"
        >
          <MessageCircle className="h-5 w-5" />
          Connect on WhatsApp
        </button>
      </div>

      {/* Connect Modal Overlay */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative text-center">
            <div className="mx-auto h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-4">
              <Info className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Student Login Required</h3>
            <p className="text-gray-500 mb-8">
              To protect the privacy and safety of our users, you need to log in as a student to view WhatsApp numbers and contact potential roommates.
            </p>
            <div className="flex flex-col gap-3">
              <a href="/login" className="w-full bg-[#1B4332] text-white py-3 rounded-xl font-bold hover:opacity-90">
                Log In
              </a>
              <button onClick={() => setShowConnectModal(false)} className="w-full py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
