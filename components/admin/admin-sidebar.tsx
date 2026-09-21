"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Home, Users, Star, CreditCard, LogOut, Menu, X,
  ShieldCheck, BarChart2, DollarSign, UserCog, Settings, ScrollText,
  Download, Clock, MessageCircle
} from "lucide-react"

const baseNavItems = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Verifications", href: "/admin/verification", icon: ShieldCheck, badge: true },
  { name: "Pending Listings", href: "/admin/listings?status=pending", icon: Clock },
  { name: "All Listings", href: "/admin/listings", icon: Home },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Roommates", href: "/admin/roommates", icon: Users },
  { name: "Reviews", href: "/admin/reviews", icon: Star },
  { name: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
]

const superAdminNavItems = [
  { name: "Analytics", href: "/admin/analytics", icon: BarChart2 },
  { name: "WhatsApp Clicks", href: "/admin/whatsapp-analytics", icon: MessageCircle },
  { name: "Revenue", href: "/admin/revenue", icon: DollarSign },
  { name: "Admin Accounts", href: "/admin/admins", icon: UserCog },
  { name: "Platform Settings", href: "/admin/settings", icon: Settings },
  { name: "Audit Log", href: "/admin/audit", icon: ScrollText },
  { name: "Data Export", href: "/admin/export", icon: Download },
]

export function AdminSidebar({ role, pendingCount = 0 }: { role?: string; pendingCount?: number }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // Close dropdown when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const isActive = (href: string) =>
    pathname === href ||
    (href === "/admin/verification" && pathname.startsWith("/admin/verification")) ||
    (href.split("?")[0] === "/admin/listings" && !href.includes("?") && pathname === "/admin/listings")

  return (
    <>
      {/* ── Desktop Sidebar (md+) ─────────────────────────────── */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 z-50 w-64 bg-[#1B4332] text-white shadow-2xl overflow-y-auto">
        <div className="flex flex-col h-full">
          <div className="p-8 flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2">
              <Image src="/logo.jpg" alt="HousePlug Logo" width={40} height={40} className="rounded-xl bg-white p-0.5" />
              <div className="flex flex-col">
                <span className="text-xl font-bold leading-none">HousePlug</span>
                <span className="text-[10px] uppercase tracking-widest text-white/50 font-bold mt-1">Admin Panel</span>
              </div>
            </Link>
          </div>

          <nav className="mt-4 flex-1 px-4 space-y-2 pb-8">
            {baseNavItems.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                    active
                      ? "bg-[#F59E0B] text-[#1B4332] font-bold shadow-xl shadow-[#F59E0B]/10"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${active ? "text-[#1B4332]" : "text-white/40 group-hover:text-white/80"}`} />
                    <span className="text-sm tracking-wide">{item.name}</span>
                  </div>
                  {item.badge && pendingCount > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${active ? "bg-[#1B4332] text-white" : "bg-red-500 text-white animate-pulse"}`}>
                      {pendingCount}
                    </span>
                  )}
                </Link>
              )
            })}

            {role === "super_admin" && (
              <>
                <div className="pt-6 pb-2 px-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Super Admin</span>
                </div>
                {superAdminNavItems.map((item) => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                        active
                          ? "bg-[#F59E0B] text-[#1B4332] font-bold shadow-xl shadow-[#F59E0B]/10"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${active ? "text-[#1B4332]" : "text-white/40 group-hover:text-white/80"}`} />
                        <span className="text-sm tracking-wide">{item.name}</span>
                      </div>
                    </Link>
                  )
                })}
              </>
            )}
          </nav>

          <div className="p-6 border-t border-white/10">
            <form action="/api/auth/signout" method="post">
              <button className="flex items-center gap-3 px-4 py-4 w-full text-left rounded-2xl hover:bg-red-500/10 text-red-400 transition-all duration-300 group">
                <div className="p-2 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                  <LogOut className="w-5 h-5" />
                </div>
                <span className="font-semibold text-sm">Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ── Mobile Top Bar ────────────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-white border-b border-gray-100 px-4 py-3 shadow-sm">
        <Link href="/admin" className="flex items-center gap-2">
          <Image src="/logo.jpg" alt="HousePlug Logo" width={28} height={28} className="rounded-lg" />
          <span className="font-bold text-[#1B4332]">Admin Panel</span>
        </Link>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-gray-600 active:bg-gray-50 rounded-lg"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* ── Mobile Dropdown ───────────────────────────────────── */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-30 md:hidden" onClick={() => setIsOpen(false)} />
          <div className="fixed right-4 top-[57px] z-40 w-72 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl md:hidden overflow-y-auto max-h-[80vh]">
            <nav className="flex flex-col space-y-1.5">
              {pendingCount > 0 && (
                <div className="rounded-xl bg-red-50 border border-red-100 p-3 mb-1">
                  <p className="text-xs font-bold text-red-600">
                    {pendingCount} pending verification{pendingCount !== 1 ? "s" : ""}
                  </p>
                </div>
              )}

              {baseNavItems.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-sm font-bold transition active:scale-95 ${
                      active
                        ? "bg-[#1B4332] text-white border-[#1B4332]"
                        : "bg-white text-gray-700 border-gray-100 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && pendingCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white">
                        {pendingCount}
                      </span>
                    )}
                  </Link>
                )
              })}

              {role === "super_admin" && (
                <>
                  <div className="border-t border-gray-100 my-1" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1 pb-1">Super Admin</p>
                  {superAdminNavItems.map((item) => {
                    const active = isActive(item.href)
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-bold transition active:scale-95 ${
                          active
                            ? "bg-[#1B4332] text-white border-[#1B4332]"
                            : "bg-white text-gray-700 border-gray-100 hover:bg-gray-50"
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    )
                  })}
                </>
              )}

              <div className="border-t border-gray-100 pt-1" />
              <form action="/api/auth/signout" method="post">
                <button className="flex items-center justify-center gap-2 w-full p-3 rounded-xl border-2 border-red-50 text-red-600 font-bold text-sm active:bg-red-50 transition">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </form>
            </nav>
          </div>
        </>
      )}

      {/* ── Mobile Bottom Nav ─────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around bg-white/95 border-t border-gray-100 px-2 py-2 pb-safe shadow-[0_-1px_15px_rgba(0,0,0,0.08)] backdrop-blur-md">
        {[
          { href: "/admin", icon: LayoutDashboard, label: "Overview" },
          { href: "/admin/verification", icon: ShieldCheck, label: "Verify", badge: true },
          { href: "/admin/listings", icon: Home, label: "Listings" },
          { href: "/admin/users", icon: Users, label: "Users" },
          { href: "/admin/settings", icon: Settings, label: "Settings" },
        ].map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-1 p-2 rounded-lg transition active:scale-95 ${
                active ? "text-[#1B4332]" : "text-gray-400"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
              {item.badge && pendingCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              )}
              <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
