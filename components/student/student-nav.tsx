"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Heart,
  Users,
  User,
  Menu,
  X,
  Search,
  LogOut,
  Wrench,
  ShieldCheck,
  HelpCircle,
  FileText,
  UserCheck
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/types"

const bottomNavItems = [
  { href: "/student/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/browse", icon: Search, label: "Explore" },
  { href: "/student/requests", icon: FileText, label: "Requests" },
  { href: "/student/saved", icon: Heart, label: "Saved" },
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

  const isVerified = profile?.verification_status === "verified"

  return (
    <>
      {/* ── Mobile Top Bar (Hidden on lg+ desktop where sidebar renders) ───────────────── */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 shadow-2xs">
        <Link href="/student/dashboard" className="flex items-center gap-2.5">
          <Image 
            src="/logo.png" 
            alt="HousePlug" 
            width={28} 
            height={28} 
            className="rounded-lg shadow-2xs" 
          />
          <div>
            <span className="text-base font-black tracking-tight text-[#1B4332] block leading-tight">
              HousePlug
            </span>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
              Student Space
            </span>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "Close student menu" : "Open student menu"}
          className="rounded-xl p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
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
              <div className="pb-3 mb-3 border-b border-gray-100 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center font-extrabold text-[#1B4332] text-sm shrink-0">
                  {profile.full_name?.charAt(0) ?? "S"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 truncate">{profile.full_name ?? "Student"}</p>
                  <p className="text-[11px] text-gray-500 flex items-center gap-1">
                    {isVerified ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                        <ShieldCheck className="h-3 w-3 text-[#10B981]" /> Verified
                      </span>
                    ) : (
                      "Student Portal"
                    )}
                  </p>
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
                <span>Explore Lodges</span>
              </Link>
              <Link
                href="/student/requests"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FileText className="h-4 w-4 text-emerald-600" />
                <span>Housing Requests</span>
              </Link>
              <Link
                href="/student/connections"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <UserCheck className="h-4 w-4 text-blue-600" />
                <span>Roommate Connections</span>
              </Link>
              <Link
                href="/student/roommate"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Users className="h-4 w-4 text-[#F59E0B]" />
                <span>Find Roommates</span>
              </Link>
              <Link
                href="/services"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Wrench className="h-4 w-4 text-blue-600" />
                <span>Campus Services</span>
              </Link>
              <Link
                href="/contact"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <HelpCircle className="h-4 w-4 text-gray-500" />
                <span>Help & Support</span>
              </Link>

              <div className="pt-2 mt-1 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false)
                    onLogout()
                  }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </nav>
          </div>
        </>
      )}

      {/* ── Mobile Bottom Navigation (lg:hidden) ────────────────────── */}
      <nav 
        aria-label="Student mobile navigation"
        className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-gray-200/90 bg-white/95 px-2 py-1 shadow-lg backdrop-blur-md lg:hidden pb-safe"
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
              <Icon className={`h-5 w-5 ${active ? "stroke-[2.4] scale-105 text-[#1B4332]" : "stroke-[1.8]"}`} />
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
