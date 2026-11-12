"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Home,
  Users,
  Star,
  CreditCard,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  BarChart2,
  DollarSign,
  UserCog,
  Settings,
  ScrollText,
  Download,
  Clock,
  MessageCircle,
  School,
  ExternalLink,
  ShieldAlert,
} from "lucide-react"

type AdminSidebarProps = {
  role?: string
  pendingCount?: number
}

type NavItem = {
  name: string
  href: string
  icon: any
  badge?: boolean
  superAdminOnly?: boolean
}

type NavGroup = {
  title: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { name: "Platform Analytics", href: "/admin/analytics", icon: BarChart2, superAdminOnly: true },
    ],
  },
  {
    title: "Marketplace",
    items: [
      { name: "All Listings", href: "/admin/listings", icon: Home },
      { name: "Pending Approval", href: "/admin/listings?status=pending", icon: Clock },
      { name: "Roommates", href: "/admin/roommates", icon: Users },
      { name: "Campus Requests", href: "/admin/university-requests", icon: School },
    ],
  },
  {
    title: "Trust & Safety",
    items: [
      { name: "Verifications", href: "/admin/verification", icon: ShieldCheck, badge: true },
      { name: "Reviews", href: "/admin/reviews", icon: Star },
      { name: "Appeals", href: "/admin#appeals", icon: ShieldAlert },
    ],
  },
  {
    title: "Business",
    items: [
      { name: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
      { name: "Revenue", href: "/admin/revenue", icon: DollarSign, superAdminOnly: true },
      { name: "WhatsApp Analytics", href: "/admin/whatsapp-analytics", icon: MessageCircle },
    ],
  },
  {
    title: "Administration",
    items: [
      { name: "Users", href: "/admin/users", icon: Users },
      { name: "Admin Accounts", href: "/admin/admins", icon: UserCog, superAdminOnly: true },
      { name: "Audit Log", href: "/admin/audit", icon: ScrollText, superAdminOnly: true },
      { name: "Data Export", href: "/admin/export", icon: Download, superAdminOnly: true },
      { name: "Settings", href: "/admin/settings", icon: Settings, superAdminOnly: true },
    ],
  },
]

export function AdminSidebar({ role, pendingCount = 0 }: AdminSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const isSuperAdmin = role === "super_admin"

  // Close drawer when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const isItemActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin"
    }
    if (href === "/admin/listings?status=pending") {
      return pathname === "/admin/listings" && typeof window !== "undefined" && window.location.search.includes("status=pending")
    }
    if (href === "/admin/listings") {
      return pathname === "/admin/listings" && (typeof window === "undefined" || !window.location.search.includes("status=pending"))
    }
    if (href === "/admin#appeals") {
      return pathname === "/admin" && typeof window !== "undefined" && window.location.hash === "#appeals"
    }
    return pathname === href || pathname.startsWith(href + "/")
  }

  // Filter groups according to current administrator role
  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.superAdminOnly || isSuperAdmin),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <>
      {/* ── Desktop Admin Sidebar (md+) ───────────────────────── */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 z-50 w-64 bg-[#1B4332] text-white shadow-2xl overflow-y-auto">
        <div className="flex flex-col h-full">
          {/* Brand header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2.5">
              <Image 
                src="/logo.png" 
                alt="HousePlug Logo" 
                width={36} 
                height={36} 
                className="rounded-xl bg-white p-0.5 shadow-xs" 
              />
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight leading-none text-white">HousePlug</span>
                <span className="text-[10px] uppercase tracking-widest text-[#F59E0B] font-extrabold mt-1">
                  {isSuperAdmin ? "Super Admin" : "Admin Panel"}
                </span>
              </div>
            </Link>
          </div>

          {/* Grouped Nav Items */}
          <nav aria-label="Admin Navigation" className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
            {visibleGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40 px-3 pb-1">
                  {group.title}
                </p>
                {group.items.map((item) => {
                  const active = isItemActive(item.href)
                  const Icon = item.icon

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        active
                          ? "bg-[#F59E0B] text-[#1B4332] shadow-sm font-extrabold"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${active ? "text-[#1B4332]" : "text-white/50"}`} />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && pendingCount > 0 && (
                        <span 
                          className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                            active ? "bg-[#1B4332] text-white" : "bg-red-500 text-white animate-pulse"
                          }`}
                        >
                          {pendingCount}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            ))}

            {/* Public website link */}
            <div className="pt-2 border-t border-white/10">
              <Link
                href="/browse"
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              >
                <span>View Marketplace</span>
                <ExternalLink className="h-3 w-3 text-white/40" />
              </Link>
            </div>
          </nav>

          {/* Sign Out */}
          <div className="p-4 border-t border-white/10 bg-black/10">
            <form action="/api/auth/signout" method="post">
              <button 
                type="submit"
                className="flex items-center gap-2.5 px-3 py-2 w-full text-left rounded-xl hover:bg-red-500/15 text-red-300 font-bold text-xs transition-colors"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ── Mobile Top Bar (md:hidden) ────────────────────────── */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 shadow-2xs">
        <Link href="/admin" className="flex items-center gap-2.5">
          <Image 
            src="/logo.png" 
            alt="HousePlug Logo" 
            width={30} 
            height={30} 
            className="rounded-lg shadow-2xs" 
          />
          <div>
            <span className="font-extrabold text-sm text-[#1B4332] block leading-tight">HousePlug</span>
            <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest leading-none">Admin Panel</span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" title={`${pendingCount} pending items`} />
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 text-gray-600 active:bg-gray-100 rounded-xl transition-colors"
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* ── Mobile Drawer ────────────────────────────────────── */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 md:hidden animate-in fade-in duration-150" onClick={() => setIsOpen(false)} />
          <div className="fixed right-3 top-[58px] z-50 w-72 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl md:hidden overflow-y-auto max-h-[85vh] animate-in zoom-in-95 duration-150">
            {pendingCount > 0 && (
              <div className="rounded-xl bg-red-50 border border-red-100 p-3 mb-3">
                <p className="text-xs font-bold text-red-700">
                  {pendingCount} pending verification{pendingCount !== 1 ? "s" : ""}
                </p>
              </div>
            )}

            <nav className="flex flex-col space-y-4">
              {visibleGroups.map((group) => (
                <div key={group.title} className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-2 pb-0.5">
                    {group.title}
                  </p>
                  {group.items.map((item) => {
                    const active = isItemActive(item.href)
                    const Icon = item.icon

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all ${
                          active
                            ? "bg-[#1B4332] text-white"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </div>
                        {item.badge && pendingCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-red-500 text-white">
                            {pendingCount}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              ))}

              <div className="border-t border-gray-100 pt-2">
                <form action="/api/auth/signout" method="post">
                  <button 
                    type="submit"
                    className="flex items-center justify-center gap-2 w-full p-2.5 rounded-xl border border-red-100 text-red-600 font-bold text-xs hover:bg-red-50 transition"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </form>
              </div>
            </nav>
          </div>
        </>
      )}

      {/* ── Mobile Bottom Nav (md:hidden) ────────────────────── */}
      <nav 
        aria-label="Admin Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around bg-white/95 backdrop-blur-md border-t border-gray-100 px-2 pt-1 pb-safe shadow-[0_-1px_15px_rgba(0,0,0,0.06)]"
      >
        {[
          { href: "/admin", icon: LayoutDashboard, label: "Overview" },
          { href: "/admin/verification", icon: ShieldCheck, label: "Verify", badge: true },
          { href: "/admin/listings", icon: Home, label: "Listings" },
          { href: "/admin/users", icon: Users, label: "Users" },
          // Super admin gets settings; regular admin gets reviews (avoiding unauthorized redirect!)
          isSuperAdmin
            ? { href: "/admin/settings", icon: Settings, label: "Settings" }
            : { href: "/admin/reviews", icon: Star, label: "Reviews" },
        ].map((item) => {
          const Icon = item.icon
          const active = isItemActive(item.href)

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
              <div className="relative">
                <Icon className={`h-5 w-5 ${active ? "stroke-[2.4] scale-105" : "stroke-[1.8]"}`} />
                {item.badge && pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </div>
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
