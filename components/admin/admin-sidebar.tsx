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
  FileText,
  AlertTriangle,
  Share2,
  Search,
  Package,
  Wrench,
  Video
} from "lucide-react"

type AdminSidebarProps = {
  role?: string
  pendingCount?: number
  pendingServicesCount?: number
}

type NavItem = {
  name: string
  href: string
  icon: any
  badge?: boolean
  badgeKey?: "verifications" | "services"
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
      { name: "Outcomes", href: "/admin/outcomes", icon: BarChart2, superAdminOnly: true },
    ],
  },
  {
    title: "Marketplace",
    items: [
      { name: "All Listings", href: "/admin/listings", icon: Home },
      { name: "Pending Approval", href: "/admin/listings?status=pending", icon: Clock },
      { name: "Campus Services", href: "/admin/services", icon: Wrench, badgeKey: "services" },
      { name: "Inventory", href: "/admin/inventory", icon: Package },
      { name: "Housing Requests", href: "/admin/requests", icon: Search },
      { name: "Roommates", href: "/admin/roommates", icon: Users },
      { name: "Campus Requests", href: "/admin/university-requests", icon: School },
    ],
  },
  {
    title: "Trust & Safety",
    items: [
      { name: "Verifications", href: "/admin/verification", icon: ShieldCheck, badgeKey: "verifications" },
      { name: "Service Vetting", href: "/admin/services?status=pending", icon: Wrench, badgeKey: "services" },
      { name: "User Reports", href: "/admin/reports", icon: AlertTriangle },
      { name: "Reviews", href: "/admin/reviews", icon: Star },
      { name: "Appeals", href: "/admin#appeals", icon: ShieldAlert },
    ],
  },
  {
    title: "Business",
    items: [
      { name: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
      { name: "Revenue", href: "/admin/revenue", icon: DollarSign, superAdminOnly: true },
      { name: "Referrals", href: "/admin/referrals", icon: Share2 },
      { name: "WhatsApp Analytics", href: "/admin/whatsapp-analytics", icon: MessageCircle },
    ],
  },
  {
    title: "Administration",
    items: [
      { name: "Users", href: "/admin/users", icon: Users },
      { name: "Media & Quota", href: "/admin/media-quota", icon: Video },
      { name: "Editorial Guides", href: "/admin/content", icon: FileText },
      { name: "Admin Accounts", href: "/admin/admins", icon: UserCog, superAdminOnly: true },
      { name: "Audit Log", href: "/admin/audit", icon: ScrollText, superAdminOnly: true },
      { name: "Data Export", href: "/admin/export", icon: Download, superAdminOnly: true },
      { name: "Settings", href: "/admin/settings", icon: Settings, superAdminOnly: true },
    ],
  },
]

export function AdminSidebar({ role, pendingCount = 0, pendingServicesCount = 0 }: AdminSidebarProps) {
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
    if (href === "/admin/services?status=pending") {
      return pathname === "/admin/services" && typeof window !== "undefined" && window.location.search.includes("status=pending")
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
                width={32}
                height={32}
                className="rounded-lg bg-white p-0.5 shadow-xs"
              />
              <div>
                <span className="text-lg font-black tracking-tight text-white block leading-tight">
                  HousePlug
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#F59E0B] block">
                  {isSuperAdmin ? "Super Admin" : "Admin Console"}
                </span>
              </div>
            </Link>
          </div>

          {/* Pending Alerts */}
          {(pendingCount > 0 || pendingServicesCount > 0) && (
            <div className="mx-4 mt-4 space-y-2">
              {pendingCount > 0 && (
                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-400/30">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#F59E0B] shrink-0" />
                    <p className="text-xs font-bold text-amber-200">
                      {pendingCount} pending verification{pendingCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <Link
                    href="/admin/verification"
                    className="mt-2 block text-[11px] font-extrabold text-[#F59E0B] hover:underline"
                  >
                    Review verifications &rarr;
                  </Link>
                </div>
              )}
              {pendingServicesCount > 0 && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/30">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-emerald-400 shrink-0" />
                    <p className="text-xs font-bold text-emerald-200">
                      {pendingServicesCount} pending service{pendingServicesCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <Link
                    href="/admin/services?status=pending"
                    className="mt-2 block text-[11px] font-extrabold text-emerald-400 hover:underline"
                  >
                    Review services &rarr;
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Navigation Groups */}
          <nav className="flex-1 px-4 py-4 space-y-6">
            {visibleGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <p className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-white/40">
                  {group.title}
                </p>
                {group.items.map((item) => {
                  const active = isItemActive(item.href)
                  const Icon = item.icon

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                        active
                          ? "bg-white text-[#1B4332] shadow-sm font-black"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`h-4 w-4 shrink-0 ${active ? "text-[#1B4332]" : "text-white/70"}`} />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {((item.badgeKey === "verifications" || item.badge) && pendingCount > 0) && (
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                          active ? "bg-amber-100 text-amber-900" : "bg-[#F59E0B] text-gray-900"
                        }`}>
                          {pendingCount}
                        </span>
                      )}
                      {item.badgeKey === "services" && pendingServicesCount > 0 && (
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                          active ? "bg-emerald-100 text-emerald-900" : "bg-emerald-400 text-gray-900"
                        }`}>
                          {pendingServicesCount}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>

          {/* Bottom links */}
          <div className="p-4 border-t border-white/10 space-y-1">
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white transition-all"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="h-3.5 w-3.5" />
                View Live Site
              </span>
            </Link>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/20 hover:text-red-100 transition-all text-left"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ── Mobile Admin Header ─────────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between bg-white border-b border-gray-100 px-4 py-3 shadow-2xs">
        <Link href="/admin" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="HousePlug Logo"
            width={28}
            height={28}
            className="rounded-lg shadow-2xs"
          />
          <div>
            <span className="text-base font-black text-[#1B4332] block leading-tight">HousePlug</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Admin Panel</span>
          </div>
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close admin drawer" : "Open admin drawer"}
          className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* ── Mobile Admin Drawer ─────────────────────────────────── */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-72 bg-white p-5 overflow-y-auto shadow-2xl md:hidden animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <span className="text-sm font-extrabold text-[#1B4332]">Admin Navigation</span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="py-4 space-y-6">
              {visibleGroups.map((group) => (
                <div key={group.title} className="space-y-1">
                  <p className="px-1 pb-1 text-[10px] font-black uppercase tracking-wider text-gray-400">
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
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                          active
                            ? "bg-[#1B4332] text-white"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="h-4 w-4 shrink-0" />
                          <span>{item.name}</span>
                        </div>
                        {((item.badgeKey === "verifications" || item.badge) && pendingCount > 0) && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900">
                            {pendingCount}
                          </span>
                        )}
                        {item.badgeKey === "services" && pendingServicesCount > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-900">
                            {pendingServicesCount}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              ))}
            </nav>

            <div className="pt-4 border-t border-gray-100 space-y-2">
              <Link
                href="/"
                target="_blank"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                <ExternalLink className="h-4 w-4" />
                Live Website
              </Link>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 text-left"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </>
      )}

      {/* ── Mobile Admin Bottom Navigation (md:hidden) ──────────── */}
      <nav 
        aria-label="Admin Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-gray-200/90 bg-white/95 px-2 py-1 shadow-lg backdrop-blur-md pb-safe"
      >
        {[
          { href: "/admin", icon: LayoutDashboard, label: "Overview" },
          { href: "/admin/listings", icon: Home, label: "Listings" },
          { href: "/admin/verification", icon: ShieldCheck, label: "Verify" },
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
