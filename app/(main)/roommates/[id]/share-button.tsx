"use client"

import { Share2, Check } from "lucide-react"
import { useState } from "react"

export function ShareButton({ url, firstName, intent }: { url: string; firstName?: string; intent?: string }) {
  const [copied, setCopied] = useState(false)

  const name = firstName || "this student"
  const shareText = intent === "have_room"
    ? `Check out ${name}'s roommate profile on HousePlug — they have a room available! 🏠`
    : `Check out ${name}'s roommate profile on HousePlug — wanna team up? 🤝`

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${name}'s Roommate Profile — HousePlug`,
          text: shareText,
          url: url,
        })
      } catch (err) {
        console.error("Error sharing:", err)
      }
    } else {
      // Fallback to copy to clipboard
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-emerald-500" /> Copied!
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" /> Share Profile
        </>
      )}
    </button>
  )
}

