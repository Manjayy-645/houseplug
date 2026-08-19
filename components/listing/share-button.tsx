"use client"

import { useState } from "react"
import { Share2, Check } from "lucide-react"
import { cn } from "@/lib/utils"

type ShareButtonProps = {
  title: string
  url?: string
  className?: string
  iconClassName?: string
}

export default function ShareButton({ title, url, className, iconClassName }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "")

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: shareUrl,
        })
        return
      } catch (err) {
        if ((err as Error).name === "AbortError") return
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy link", err)
    }
  }

  return (
    <button
      onClick={handleShare}
      className={cn(
        "flex items-center justify-center rounded-full bg-white/80 p-2 text-gray-600 backdrop-blur-md transition-all hover:scale-110 hover:bg-white hover:text-blue-500",
        copied && "text-emerald-500 hover:text-emerald-500",
        className
      )}
      aria-label="Share listing"
    >
      {copied ? (
        <Check className={cn("h-5 w-5", iconClassName)} />
      ) : (
        <Share2 className={cn("h-5 w-5", iconClassName)} />
      )}
    </button>
  )
}