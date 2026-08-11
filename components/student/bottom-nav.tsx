"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Heart, Users, User } from "lucide-react"

const navItems = [
  { href: "/student/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/student/saved", icon: Heart, label: "Saved" },
  { href: "/student/roommate", icon: Users, label: "Roommate" },
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
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition active:scale-95 ${
              active ? "text-[#1B4332]" : "text-gray-400"
            }`}
          >
            <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
            <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
            {active && <span className="absolute bottom-0 w-6 h-0.5 bg-[#1B4332] rounded-full" />}
          </Link>
        )
      })}
    </nav>
  )
}
