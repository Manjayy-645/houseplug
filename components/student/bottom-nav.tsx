"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Heart, Users, User, Wrench } from "lucide-react"

const navItems = [
  { href: "/student/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/services", icon: Wrench, label: "Services", isNew: true },
  { href: "/student/roommate", icon: Users, label: "Roommate" },
  { href: "/student/saved", icon: Heart, label: "Saved" },
  { href: "/student/profile", icon: User, label: "Profile" },
]

export function StudentBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around bg-white/95 border-t border-gray-100 px-2 py-2 pb-safe shadow-[0_-1px_15px_rgba(0,0,0,0.08)] backdrop-blur-md lg:hidden">
      {navItems.map((item) => {
        const Icon = item.icon
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center gap-1 p-2 rounded-lg transition active:scale-95 ${
              active ? "text-[#1B4332]" : "text-gray-400"
            }`}
          >
            {item.isNew && !active && (
              <span className="absolute top-1 right-1 px-1 py-0.2 rounded-full bg-[#1B4332] text-[#F59E0B] text-[7px] font-black uppercase tracking-wider leading-none shadow-xs border border-emerald-500/40 animate-pulse">
                NEW
              </span>
            )}
            <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
            <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
            {active && <span className="absolute bottom-0 w-6 h-0.5 bg-[#1B4332] rounded-full" />}
          </Link>
        )
      })}
    </nav>
  )
}
