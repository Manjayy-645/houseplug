"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  CreditCard,
  Eye,
  LayoutDashboard,
  LogOut,
  Plus,
  Star,
  User,
  Menu,
  X
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Plan } from "@/types"

type SidebarProps = {
  plan: Plan
  listingCount: number
  listingLimit: number
}

const navItems = [
  { href: "/landlord/dashboard", label: "My Rooms", icon: LayoutDashboard },
  { href: "/landlord/listings/new", label: "Add New", icon: Plus },
  { href: "/landlord/analytics", label: "Stats", icon: Eye },
  { href: "/landlord/reviews", label: "Reviews", icon: Star },
  { href: "/landlord/subscription", label: "Plan", icon: CreditCard },
  { href: "/landlord/profile", label: "Profile", icon: User }
]

export function LandlordSidebar({ plan, listingCount, listingLimit }: SidebarProps) {
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
      {/* Desktop Sidebar */}
      <aside className="hidden w-[220px] flex-col bg-[#1B4332] text-white lg:flex sticky top-0 h-screen">
        <div className="border-b border-white/15 px-4 py-5">
          <Link href="/landlord/dashboard" className="text-xl font-bold hover:text-[#F59E0B] transition">
            HousePlug
          </Link>
          <p className="mt-1 text-xs text-white/70">Landlord Console</p>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-md border-l-4 px-3 py-2.5 text-sm transition ${
                  active
                    ? "border-l-[#F59E0B] bg-[#2A5A45] text-white"
                    : "border-l-transparent text-white/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="space-y-3 border-t border-white/15 p-3">
          <div className="rounded-md bg-white/10 p-3 text-xs">
            <p className="font-semibold uppercase tracking-wide text-white/80">{plan} plan</p>
            <p className="mt-1 text-white/90">
              {listingCount}/{listingLimit} listings
            </p>
            {plan === "free" ? (
              <Link href="/landlord/subscription" className="mt-2 inline-block font-semibold text-[#F59E0B] hover:underline">
                Upgrade &rarr;
              </Link>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-white/90 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-white border-b border-gray-100 px-4 py-3 shadow-sm">
        <Link href="/landlord/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1B4332] text-white font-bold text-xs">
            H
          </div>
          <span className="font-bold text-[#1B4332]">Landlord Console</span>
        </Link>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1 text-gray-600 active:bg-gray-50 rounded-lg">
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 top-[53px] z-40 bg-white lg:hidden overflow-y-auto">
          <nav className="flex flex-col p-6 space-y-4">
             <div className="rounded-xl bg-[#1B4332]/5 p-4 mb-2 border border-[#1B4332]/10">
               <p className="text-xs font-bold text-[#1B4332] uppercase tracking-widest">Active Plan</p>
               <div className="flex items-center justify-between mt-1">
                 <p className="text-lg font-black text-[#1B4332] capitalize">{plan}</p>
                 <span className="text-sm font-bold text-gray-500">{listingCount} / {listingLimit} Rooms</span>
               </div>
               {plan === 'free' && (
                 <Link 
                  href="/landlord/subscription" 
                  onClick={() => setIsMenuOpen(false)}
                  className="mt-3 block text-center rounded-lg bg-[#F59E0B] py-2 text-xs font-black text-gray-900"
                 >
                   Upgrade to Pro
                 </Link>
               )}
             </div>

             {navItems.map((item) => {
               const Icon = item.icon
               const active = pathname === item.href
               return (
                 <Link
                   key={item.href}
                   href={item.href}
                   onClick={() => setIsMenuOpen(false)}
                   className={`flex items-center justify-between p-4 rounded-xl border transition active:scale-95 ${
                     active ? "bg-[#1B4332] text-white border-[#1B4332] shadow-lg shadow-emerald-900/10" : "bg-white border-gray-100 text-gray-700 shadow-sm"
                   }`}
                 >
                   <div className="flex items-center gap-3 font-bold">
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                   </div>
                   <Plus className={`h-4 w-4 opacity-50 ${active ? "rotate-45" : ""}`} />
                 </Link>
               )
             })}
             
             <button
               onClick={onLogout}
               className="flex items-center justify-center gap-2 w-full p-4 rounded-xl border-2 border-red-50 text-red-600 font-black mt-4 active:bg-red-50 transition"
             >
               <LogOut className="h-5 w-5" />
               Sign Out
             </button>

             <div className="pt-8 pb-12 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                HousePlug Landlord v1.0
             </div>
          </nav>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around bg-white/95 border-t border-gray-100 px-2 py-2 pb-safe shadow-[0_-1px_15px_rgba(0,0,0,0.08)] backdrop-blur-md">
        {[
          { href: "/landlord/dashboard", icon: LayoutDashboard, label: "Home" },
          { href: "/landlord/analytics", icon: Eye, label: "Stats" },
          { href: "/landlord/listings/new", icon: Plus, label: "Add", highlight: true },
          { href: "/landlord/reviews", icon: Star, label: "Reviews" },
          { href: "/landlord/profile", icon: User, label: "Profile" }
        ].map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          if (item.highlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex h-12 w-12 -mt-8 items-center justify-center rounded-full bg-[#1B4332] text-white shadow-xl shadow-emerald-900/30 active:scale-90 transition border-4 border-white"
              >
                <Icon className="h-6 w-6" />
              </Link>
            )
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition active:scale-95 ${
                active ? "text-[#1B4332]" : "text-gray-400"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
