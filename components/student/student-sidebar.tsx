"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Search,
  Heart,
  Users,
  User,
  Wrench,
  ShieldCheck,
  HelpCircle,
  LogOut,
  ExternalLink,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/types"

type StudentSidebarProps = {
  profile?: Profile | null
  savedCount?: number
}

const navItems = [
  { href: "/student/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/browse", label: "Explore Accommodation", icon: Search, isExternal: true },
  { href: "/student/saved", label: "Saved Rooms", icon: Heart },
  { href: "/student/roommate", label: "Roommates", icon: Users },
  { href: "/student/profile", label: "Profile & Settings", icon: User },
]

export function StudentSidebar({ profile, savedCount = 0 }: StudentSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const onLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const isVerified = profile?.verification_status === "verified"

  return (
    <aside className="hidden w-[240px] flex-col bg-[#1B4332] text-white lg:flex sticky top-0 h-screen shrink-0 border-r border-[#1B4332]/40 shadow-xl">
      {/* Brand Header */}
      <div className="border-b border-white/10 px-5 py-5 flex items-center gap-3">
        <Image 
          src="/logo.png" 
          alt="HousePlug Logo" 
          width={32} 
          height={32} 
          className="rounded-lg bg-white p-0.5 shadow-xs" 
        />
        <div>
          <Link href="/student/dashboard" className="text-lg font-black tracking-tight text-white hover:text-[#F59E0B] transition-colors">
            HousePlug
          </Link>
          <p className="text-[10px] text-white/60 uppercase font-black tracking-widest leading-none mt-0.5">
            Student Portal
          </p>
        </div>
      </div>

      {/* Student Badge / Profile Snippet */}
      {profile && (
        <div className="px-4 py-3 mx-3 mt-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[#2A5A45] border border-[#F59E0B]/60 flex items-center justify-center font-bold text-xs text-white shrink-0 overflow-hidden">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name || "Student"} className="w-full h-full object-cover" />
            ) : (
              (profile.full_name?.[0] ?? "S").toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">
              {profile.full_name || "Student"}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] text-white/60 truncate">Student</span>
              {isVerified && (
                <span title="Verified Student ID" className="inline-flex">
                  <ShieldCheck className="h-3 w-3 text-[#10B981] shrink-0" />
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Primary Navigation */}
      <nav aria-label="Student Sidebar Navigation" className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 px-3 pb-1">
          Menu
        </p>
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                active
                  ? "bg-[#F59E0B] text-[#1B4332] shadow-sm font-extrabold"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${active ? "text-[#1B4332]" : "text-white/60"}`} />
                <span>{item.label}</span>
              </div>
              {item.href === "/student/saved" && savedCount > 0 && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${active ? "bg-[#1B4332] text-white" : "bg-[#F59E0B] text-gray-950"}`}>
                  {savedCount}
                </span>
              )}
              {item.isExternal && (
                <ExternalLink className={`h-3 w-3 ${active ? "text-[#1B4332]/60" : "text-white/30"}`} />
              )}
            </Link>
          )
        })}

        {/* Secondary Links */}
        <div className="pt-4 mt-2 border-t border-white/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40 px-3 pb-1">
            Campus &amp; Support
          </p>
          <Link
            href="/services"
            className="flex items-center gap-3 rounded-xl px-3.5 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Wrench className="h-4 w-4 text-[#F59E0B]" />
            <span>Campus Services</span>
          </Link>
          <Link
            href="/safety"
            className="flex items-center gap-3 rounded-xl px-3.5 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Safety Guide</span>
          </Link>
          <Link
            href="/contact"
            className="flex items-center gap-3 rounded-xl px-3.5 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <HelpCircle className="h-4 w-4 text-white/50" />
            <span>Contact Support</span>
          </Link>
        </div>
      </nav>

      {/* Footer / Sign Out */}
      <div className="border-t border-white/10 p-3 space-y-2">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-bold text-red-300 hover:bg-red-500/15 hover:text-red-200 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
