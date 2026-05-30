"use client"

import { useState, useEffect } from "react"
import { ArrowUp } from "lucide-react"

export function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const toggle = () => setVisible(window.scrollY > 400)
    toggle()
    window.addEventListener("scroll", toggle, { passive: true })
    return () => window.removeEventListener("scroll", toggle)
  }, [])

  const scrollUp = () => window.scrollTo({ top: 0, behavior: "smooth" })

  if (!visible) return null

  return (
    <button
      onClick={scrollUp}
      aria-label="Scroll to top"
      // bottom-24 on mobile clears sticky contact bars (z-50); bottom-6 on desktop.
      className="fixed bottom-24 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-[#1B4332] text-white shadow-lg transition-all duration-200 hover:bg-[#143728] active:scale-90 md:bottom-6"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  )
}
