"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Heart, Users, User, Menu, X, Search, LogOut, Wrench, ShieldCheck, HelpCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/types"

const bottomNavItems = [
  { href: "/student/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/browse", icon: Search, label: "Explore" },
  { href: "/student/saved", icon: Heart, label: "Saved" },
  { href: "/student/roommate", icon: Users, label: "Roommate" },
  { href: "/student/profile", icon: User, label: "Profile" },
]

export function StudentNav({ profile }: { profile?: Profile | null }) {
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
      {/* ── Mobile Top Bar (Hidden on lg+ desktop) ───────────────── */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 shadow-2xs">
        <Link href="/student/dashboard" className="flex items-center gap-2.5">
          <Image 
            src="/logo.png" 
            alt="HousePlug Logo" 
            width={30} 
            height={30} 
            className="rounded-lg shadow-2xs" 
          />
          <div>
            <span className="font-extrabold text-sm text-[#1B4332] block leading-tight">HousePlug</span>
            <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest leading-none">Student</span>
          </div>
        </Link>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 text-gray-600 active:bg-gray-100 rounded-xl transition-colors"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* ── Mobile Dropdown Drawer ────────────────────────────── */}
      {isMenuOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/30 lg:hidden animate-in fade-in duration-150" 
            onClick={() => setIsMenuOpen(false)} 
          />
          <div className="fixed right-3 top-[58px] z-50 w-72 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl lg:hidden animate-in zoom-in-95 duration-150">
            {profile && (
              <div className="p-3 mb-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-[#1B4332] text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {profile.full_name?.[0] ?? "S"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-900 truncate">{profile.full_name || "Student"}</p>
                  <p className="text-[10px] text-gray-500 truncate">{profile.email}</p>
                </div>
              </div>
            )}

            <nav className="flex flex-col space-y-1">
              <Link
                href="/browse"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Search className="h-4 w-4 text-[#1B4332]" />
                <span>Explore Accommodation</span>
              </Link>

              <Link
                href="/services"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Wrench className="h-4 w-4 text-[#F59E0B]" />
                  <span>Campus Services</span>
                </div>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-emerald-50 text-[#1B4332] border border-emerald-200">
                  New
                </span>
              </Link>

              <Link
                href="/safety"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Safety Guide</span>
              </Link>

              <Link
                href="/contact"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <HelpCircle className="h-4 w-4 text-gray-500" />
                <span>Contact Support</span>
              </Link>

              <div className="border-t border-gray-100 my-1 pt-1" />

              <button
                onClick={onLogout}
                className="flex items-center justify-center gap-2 w-full p-2.5 rounded-xl border border-red-100 text-red-600 font-bold text-xs hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </nav>
          </div>
        </>
      )}

      {/* ── Mobile Bottom Nav (Hidden on lg+ desktop) ─────────────── */}
      <nav 
        aria-label="Student Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around bg-white/95 backdrop-blur-md border-t border-gray-100 px-2 pt-1 pb-safe shadow-[0_-1px_15px_rgba(0,0,0,0.06)]"
      >
        {bottomNavItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-col items-center justify-center min-w-[56px] min-h-[50px] py-1 px-2 rounded-xl transition-all active:scale-95 ${
                active ? "text-[#1B4332]" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "stroke-[2.4] scale-105" : "stroke-[1.8]"}`} />
              <span className={`text-[10px] mt-1 tracking-tight ${active ? "font-extrabold text-[#1B4332]" : "font-medium text-gray-500"}`}>
                {item.label}
              </span>
              {active && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-[#1B4332] rounded-full" />
              )}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
