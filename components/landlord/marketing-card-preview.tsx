"use client"

import { useState } from "react"
import { Copy, Download, MessageCircle, Star, ShieldCheck, MapPin, Home, GraduationCap } from "lucide-react"
import { getInitials } from "@/lib/utils"

type MarketingCardPreviewProps = {
  profile: any
  activeListingsCount: number
  avgRating: number
  reviewCount: number
  universities: string[]
  primaryArea: string
}

export function MarketingCardPreview({
  profile,
  activeListingsCount,
  avgRating,
  reviewCount,
  universities,
  primaryArea
}: MarketingCardPreviewProps) {
  const [copied, setCopied] = useState(false)
  const cardUrl = `https://houseplug.ng/card/${profile.username}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(cardUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = async () => {
    const element = document.getElementById('houseplug-card')
    if (!element) return
    
    const html2canvas = (await import('html2canvas')).default
    
    const canvas = await html2canvas(element, {
      scale: 3,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true,
      logging: false,
    })
    
    const link = document.createElement('a')
    link.download = `houseplug-${profile.username}-card.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const initials = profile.full_name ? getInitials(profile.full_name) : "LL"

  return (
    <div className="space-y-6 max-w-sm mx-auto">
      {/* The actual card to be downloaded - wrapped to scale for preview */}
      <div className="transform scale-[0.85] origin-top bg-white rounded-2xl shadow-xl overflow-hidden" id="houseplug-card">
        {/* Header */}
        <div className="bg-[#1B4332] px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="" className="w-8 h-8 rounded-lg bg-white p-0.5" />
            <span className="text-white font-bold text-lg">HousePlug</span>
          </div>
          <span className="text-[#F59E0B] text-xs font-bold">houseplug.ng</span>
        </div>

        {/* Body */}
        <div className="px-6 py-6 bg-white space-y-4">
          {/* Identity Row */}
          <div className="flex items-center gap-4">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-bold text-xl shrink-0">
                {initials}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-lg font-bold text-[#111827]">{profile.full_name}</span>
              {profile.verification_status === 'verified' && (
                <span className="inline-flex items-center gap-1 text-[#10B981] text-sm font-medium">
                  <ShieldCheck className="w-4 h-4" /> Verified Landlord
                </span>
              )}
              {reviewCount > 0 && (
                <span className="flex items-center gap-1 text-gray-500 text-sm mt-0.5">
                  <Star className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
                  {avgRating.toFixed(1)} &middot; {reviewCount} reviews
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 my-4" />

          {/* Info List */}
          <div className="flex flex-col gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm text-[#374151]"><MapPin className="h-4 w-4 text-[#374151]" /> {primaryArea || 'Port Harcourt'}</span>
            <span className="inline-flex items-center gap-1.5 text-sm text-[#374151]">
              <Home className="h-4 w-4 text-[#374151]" /> {activeListingsCount} Active Listing{activeListingsCount !== 1 ? 's' : ''}
            </span>
            {activeListingsCount > 0 && universities.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-sm text-[#374151]">
                <GraduationCap className="h-4 w-4 text-[#374151]" /> Near {universities.join(' & ')}
              </span>
            )}
            {activeListingsCount > 0 && universities.length === 0 && (
              <span className="inline-flex items-center gap-1.5 text-sm text-[#374151]"><GraduationCap className="h-4 w-4 text-[#374151]" /> Near Port Harcourt Campus</span>
            )}
          </div>

          <div className="h-4" />

          {/* Link Box */}
          <a 
            href={`/landlord/${profile.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-[#FFFBEB] border-[1.5px] border-[#F59E0B] rounded-xl p-4 cursor-pointer hover:bg-amber-50 transition"
          >
            <p className="text-xs text-[#6B7280] mb-1">View all my listings:</p>
            <p className="text-base font-bold text-[#1B4332] break-all">
              houseplug.ng/landlord/{profile.username}
            </p>
          </a>

          <div className="h-4" />

          {/* Tagline */}
          <p className="text-sm text-[#6B7280] text-center italic">
            "Find verified student housing without agent stress"
          </p>
        </div>

        {/* Footer */}
        <div className="bg-[#F9FAFB] px-6 py-3 border-t border-gray-100 text-center">
          <span className="text-xs text-[#9CA3AF]">Powered by HousePlug &middot; houseplug.ng</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-3 gap-2 mt-[-2rem] relative z-10">
        <button
          onClick={handleCopyLink}
          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition active:scale-95"
        >
          {copied ? <ShieldCheck className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          <span className="text-[10px] font-bold uppercase tracking-wider">{copied ? 'Copied!' : 'Copy Link'}</span>
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`I have verified student rooms available near campus.\nView my HousePlug listing card:\n${cardUrl}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-[#25D366] text-white hover:brightness-110 transition active:scale-95"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">WhatsApp</span>
        </a>
        <button
          onClick={handleDownload}
          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-[#F59E0B] text-white hover:brightness-110 transition active:scale-95"
        >
          <Download className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Download</span>
        </button>
      </div>
    </div>
  )
}
