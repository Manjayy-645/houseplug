"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Wrench, Sparkles, X, ArrowRight } from "lucide-react"

export function GlobalServiceBadge() {
  const pathname = usePathname()
  const [dismissed, setDismissed] = useState(true) // default hidden until mounted

  useEffect(() => {
    // Check if dismissed in this browser session
    const isDismissed = sessionStorage.getItem("hp_services_badge_dismissed")
    if (!isDismissed) {
      setDismissed(false)
    }
  }, [])

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDismissed(true)
    sessionStorage.setItem("hp_services_badge_dismissed", "true")
  }

  // Hide on service pages, auth, and admin routes
  if (
    dismissed ||
    !pathname ||
    pathname.startsWith("/services") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/banned")
  ) {
    return null
  }

  return (
    <aside
      aria-label="New Campus Services Announcement"
      className="fixed bottom-20 left-3 md:bottom-6 md:left-6 z-40 animate-in fade-in slide-in-from-bottom-3 duration-300"
    >
      <div className="relative group">
        <Link
          href="/services"
          className="flex items-center gap-2.5 bg-[#1B4332] text-white pl-3 pr-8 py-2.5 md:py-2 rounded-full shadow-lg shadow-[#1B4332]/30 border border-emerald-600/30 hover:bg-[#143728] hover:scale-[1.02] active:scale-95 transition-all"
        >
          {/* Glowing Icon */}
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#F59E0B] to-amber-300 text-[#1B4332] flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/40">
            <Wrench className="w-3.5 h-3.5" />
          </div>

          {/* Text Content */}
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-tight text-white">
                Campus Services
              </span>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#F59E0B] text-[#1B4332]">
                <Sparkles className="w-2.5 h-2.5 text-[#1B4332]" />
                New
              </span>
            </div>
            <span className="text-[10px] text-emerald-200/90 hidden sm:inline-block font-medium">
              Movers, gas delivery & repairs
            </span>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 transition-transform shrink-0 ml-1" />
        </Link>

        {/* Dismiss Button */}
        <button
          onClick={handleDismiss}
          type="button"
          aria-label="Dismiss services notification"
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-900/80 hover:bg-gray-900 text-white flex items-center justify-center text-[10px] shadow-sm border border-white/20 transition-colors"
        >
          <X className="w-3 h-3 text-gray-300" />
        </button>
      </div>
    </aside>
  )
}
