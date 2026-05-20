"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Home, Users, Star, CreditCard, LogOut, Menu, X, ShieldCheck, BarChart2, DollarSign, UserCog, Settings, ScrollText, Download, Clock } from "lucide-react"

const baseNavItems = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Verifications", href: "/admin/verification", icon: ShieldCheck, badge: true },
  { name: "Pending Listings", href: "/admin/listings?status=pending", icon: Clock },
  { name: "All Listings", href: "/admin/listings", icon: Home },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Reviews", href: "/admin/reviews", icon: Star },
  { name: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
]

const superAdminNavItems = [
  { name: "Analytics", href: "/admin/analytics", icon: BarChart2 },
  { name: "Revenue", href: "/admin/revenue", icon: DollarSign },
  { name: "Admin Accounts", href: "/admin/admins", icon: UserCog },
  { name: "Platform Settings", href: "/admin/settings", icon: Settings },
  { name: "Audit Log", href: "/admin/audit", icon: ScrollText },
  { name: "Data Export", href: "/admin/export", icon: Download },
]

export function AdminSidebar({ role, pendingCount = 0 }: { role?: string, pendingCount?: number }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between bg-[#1B4332] px-6 py-4 text-white shadow-lg border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#1B4332]">
            <span className="font-bold">H</span>
          </div>
          <span className="text-xl font-bold tracking-tight">HousePlug Admin</span>
        </Link>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          )}
          <button 
            onClick={() => setIsOpen(true)}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors active:scale-95"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      <div 
        className={`fixed inset-0 z-50 bg-black/60 md:hidden backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar Content */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#1B4332] text-white shadow-2xl transform transition-transform duration-300 ease-out
        md:w-64 md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
          <div className="p-8 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#1B4332]">
                <span className="text-xl font-bold">H</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold leading-none">HousePlug</span>
                <span className="text-[10px] uppercase tracking-widest text-white/50 font-bold mt-1">Admin Panel</span>
              </div>
            </Link>
            <button 
              onClick={() => setIsOpen(false)}
              className="md:hidden p-2 hover:bg-white/10 rounded-xl transition-colors"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="mt-4 flex-1 px-4 space-y-2 pb-8">
            {baseNavItems.map((item) => {
              const active = pathname === item.href || (item.href.split('?')[0] === "/admin/listings" && pathname === "/admin/listings") || (item.href === "/admin/verification" && pathname.startsWith("/admin/verification"))
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
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      active ? "bg-[#1B4332] text-white" : "bg-red-500 text-white animate-pulse"
                    }`}>
                      {pendingCount}
                    </span>
                  )}
                </Link>
              )
            })}

            {role === 'super_admin' && (
              <>
                <div className="pt-6 pb-2 px-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Super Admin</span>
                </div>
                {superAdminNavItems.map((item) => {
                  const active = pathname === item.href
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

          <div className="p-6 border-t border-white/10 bg-[#1B4332]">
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
    </>
  )
}
