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
  FileText,
  UserCheck
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
  { href: "/student/requests", label: "Housing Requests", icon: FileText },
  { href: "/student/connections", label: "Connections", icon: UserCheck },
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
          <div className="h-9 w-9 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center font-black text-white text-sm shrink-0">
            {profile.full_name?.charAt(0) ?? "S"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">{profile.full_name ?? "Student"}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isVerified ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                  <span title="Verified Student">
                    <ShieldCheck className="h-3 w-3" />
                  </span>
                  Verified
                </span>
              ) : (
                <span className="text-[10px] text-white/60 font-medium">Student</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Primary Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-wider text-white/40">
          Accommodation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
                active
                  ? "bg-white text-[#1B4332] shadow-sm shadow-black/10 font-black"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${active ? "text-[#1B4332]" : "text-white/70"}`} />
                <span>{item.label}</span>
              </div>
              {item.href === "/student/saved" && savedCount > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    active ? "bg-emerald-100 text-[#1B4332]" : "bg-white/20 text-white"
                  }`}
                >
                  {savedCount}
                </span>
              )}
              {item.isExternal && (
                <ExternalLink className={`h-3 w-3 ${active ? "text-[#1B4332]/50" : "text-white/40"}`} />
              )}
            </Link>
          )
        })}

        <div className="pt-4 pb-2">
          <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-wider text-white/40">
            Student Life
          </p>
          <Link
            href="/services"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-white/80 hover:bg-white/10 hover:text-white transition-all"
          >
            <Wrench className="h-4 w-4 text-white/70" />
            <span>Campus Services</span>
          </Link>
          <Link
            href="/contact"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-white/80 hover:bg-white/10 hover:text-white transition-all"
          >
            <HelpCircle className="h-4 w-4 text-white/70" />
            <span>Help & Support</span>
          </Link>
        </div>
      </nav>

      {/* Footer / Sign Out */}
      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-white/70 hover:bg-red-500/20 hover:text-red-200 transition-all"
        >
          <LogOut className="h-4 w-4 text-white/60" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
