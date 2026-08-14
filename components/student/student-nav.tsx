"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Heart, Users, User, Menu, X, Search, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const bottomNavItems = [
  { href: "/student/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/student/saved", icon: Heart, label: "Saved" },
  { href: "/student/roommate", icon: Users, label: "Roommate" },
  { href: "/student/profile", icon: User, label: "Profile" },
]

export function StudentNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const onLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <>
      {/* ── Mobile Top Bar ────────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-white border-b border-gray-100 px-4 py-3 shadow-sm">
        <Link href="/student/dashboard" className="flex items-center gap-2">
          <Image src="/logo.png" alt="HousePlug Logo" width={28} height={28} className="rounded-lg" />
          <div>
            <span className="font-bold text-[#1B4332]">HousePlug</span>
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest leading-none">Student</p>
          </div>
        </Link>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-1 text-gray-600 active:bg-gray-50 rounded-lg"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* ── Mobile Dropdown ───────────────────────────────────── */}
      {isMenuOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute right-4 top-[65px] z-40 w-64 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl">
            <nav className="flex flex-col space-y-2">
              <Link
                href="/browse"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white text-gray-700 shadow-sm transition active:scale-95"
              >
                <div className="flex items-center gap-3 font-bold text-sm">
                  <Search className="h-4 w-4 text-gray-400" />
                  <span>Browse Listings</span>
                </div>
              </Link>

              <Link
                href="/roommates"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-white text-gray-700 shadow-sm transition active:scale-95"
              >
                <div className="flex items-center gap-3 font-bold text-sm">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span>Find Roommate</span>
                </div>
              </Link>

              <div className="border-t border-gray-100" />

              <button
                onClick={onLogout}
                className="flex items-center justify-center gap-2 w-full p-3 rounded-xl border-2 border-red-50 text-red-600 font-bold text-sm active:bg-red-50 transition"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </nav>
          </div>
        </>
      )}

      {/* ── Mobile Bottom Nav ─────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around bg-white/95 border-t border-gray-100 px-2 py-2 pb-safe shadow-[0_-1px_15px_rgba(0,0,0,0.08)] backdrop-blur-md">
        {bottomNavItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition active:scale-95 ${
                active ? "text-[#1B4332]" : "text-gray-400"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
