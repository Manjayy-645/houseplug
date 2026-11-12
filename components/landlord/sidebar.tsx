"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  CreditCard,
  LayoutDashboard,
  LogOut,
  Plus,
  Star,
  User,
  Menu,
  X,
  ShieldCheck,
  AlertCircle,
  Search,
  ExternalLink,
  BarChart3,
  Building2,
  HelpCircle,
  PlusCircle,
  CheckCircle2
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Plan, Profile } from "@/types"

type SidebarProps = {
  plan: Plan
  listingCount: number
  verificationStatus?: Profile["verification_status"]
}

const planDisplay: Record<string, string> = {
  free: "Free Plan",
  pro: "Pro Plan",
  business: "Business Plan",
}

export function LandlordSidebar({ plan, listingCount, verificationStatus }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const isUnverified = verificationStatus === "unverified" || verificationStatus === "rejected"
  const isPending = verificationStatus === "pending"

  const onLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const workspaceNav = [
    { href: "/landlord/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/landlord/dashboard#listings", label: "My Properties", icon: Building2 },
    { href: "/landlord/listings/new", label: "Add Property", icon: PlusCircle },
    { href: "/landlord/analytics", label: "Performance", icon: BarChart3 },
  ]

  const businessNav = [
    { 
      href: "/landlord/verification", 
      label: "Verification", 
      icon: ShieldCheck, 
      badge: isUnverified ? "Unverified" : isPending ? "Pending" : null 
    },
    { href: "/landlord/subscription", label: "Subscription & Billing", icon: CreditCard },
    { href: "/landlord/reviews", label: "Reviews", icon: Star },
  ]

  const personalNav = [
    { href: "/landlord/profile", label: "Profile & Settings", icon: User },
    { href: "/contact", label: "Help & Support", icon: HelpCircle, isExternal: true },
  ]

  const isItemActive = (href: string) => {
    if (href.includes("#")) {
      return pathname === href.split("#")[0]
    }
    return pathname === href
  }

  return (
    <>
      {/* ── Desktop Sidebar (lg+) ─────────────────────────────── */}
      <aside className="hidden w-[240px] flex-col bg-[#1B4332] text-white lg:flex sticky top-0 h-screen shrink-0 border-r border-[#1B4332]/40 shadow-xl overflow-y-auto">
        {/* Brand Header */}
        <div className="border-b border-white/10 px-5 py-5 flex items-center gap-3">
          <Image 
            src="/logo.png" 
            alt="HousePlug Logo" 
            width={34} 
            height={34} 
            className="rounded-xl bg-white p-0.5 shadow-xs" 
          />
          <div>
            <Link href="/landlord/dashboard" className="text-lg font-black tracking-tight text-white hover:text-[#F59E0B] transition">
              HousePlug
            </Link>
            <p className="text-[10px] text-white/60 uppercase font-black tracking-widest leading-none mt-0.5">
              Landlord Console
            </p>
          </div>
        </div>

        {/* Grouped Navigation */}
        <nav aria-label="Landlord Console Navigation" className="flex-1 space-y-6 px-3 py-4 overflow-y-auto">
          
          {/* Group 1: WORKSPACE */}
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 px-3 pb-1">
              Workspace
            </p>
            {workspaceNav.map((item) => {
              const Icon = item.icon
              const active = isItemActive(item.href)

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                    active
                      ? "bg-[#F59E0B] text-[#1B4332] shadow-sm font-extrabold"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${active ? "text-[#1B4332]" : "text-white/60"}`} />
                    <span>{item.label}</span>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Group 2: ACCOUNT & BUSINESS */}
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 px-3 pb-1">
              Account &amp; Business
            </p>
            {businessNav.map((item) => {
              const Icon = item.icon
              const active = isItemActive(item.href)

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                    active
                      ? "bg-[#F59E0B] text-[#1B4332] shadow-sm font-extrabold"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${active ? "text-[#1B4332]" : "text-white/60"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span 
                      className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${
                        active 
                          ? "bg-[#1B4332] text-white" 
                          : item.badge === "Unverified" 
                          ? "bg-amber-400 text-gray-950" 
                          : "bg-blue-400 text-gray-950"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Group 3: PERSONAL */}
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 px-3 pb-1">
              Personal
            </p>
            {personalNav.map((item) => {
              const Icon = item.icon
              const active = isItemActive(item.href)

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                    active
                      ? "bg-[#F59E0B] text-[#1B4332] shadow-sm font-extrabold"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${active ? "text-[#1B4332]" : "text-white/60"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.isExternal && (
                    <ExternalLink className={`h-3 w-3 ${active ? "text-[#1B4332]/60" : "text-white/30"}`} />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Public Website Link */}
          <div className="pt-2 border-t border-white/10">
            <Link
              href="/browse"
              className="flex items-center justify-between rounded-xl px-3.5 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Search className="h-4 w-4 text-white/50" />
                <span>Public Marketplace</span>
              </div>
              <ExternalLink className="h-3 w-3 text-white/30" />
            </Link>
          </div>
        </nav>

        {/* Plan Status Box & Logout */}
        <div className="space-y-2 border-t border-white/10 p-3 bg-black/10">
          <div className="rounded-xl bg-white/10 p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-white">{planDisplay[plan] || "Free Plan"}</span>
              <span className="text-[10px] font-bold text-white/60">
                {listingCount} Room{listingCount === 1 ? "" : "s"}
              </span>
            </div>
            {plan === "free" ? (
              <Link 
                href="/landlord/subscription" 
                className="mt-2 block text-center rounded-lg bg-[#F59E0B] py-1.5 text-[11px] font-black text-[#1B4332] hover:brightness-105 transition"
              >
                Upgrade to Pro &rarr;
              </Link>
            ) : (
              <Link 
                href="/landlord/subscription" 
                className="mt-1.5 inline-block text-[10px] font-bold text-[#F59E0B] hover:underline"
              >
                Manage Subscription
              </Link>
            )}
          </div>

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

      {/* ── Mobile Top Header (Hidden on lg+) ─────────────────── */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 shadow-2xs">
        <Link href="/landlord/dashboard" className="flex items-center gap-2.5">
          <Image 
            src="/logo.png" 
            alt="HousePlug Logo" 
            width={30} 
            height={30} 
            className="rounded-lg shadow-2xs" 
          />
          <div>
            <span className="font-extrabold text-sm text-[#1B4332] block leading-tight">HousePlug</span>
            <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest leading-none">Landlord Console</span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/landlord/listings/new"
            className="inline-flex items-center gap-1 bg-[#1B4332] text-white text-xs font-bold px-2.5 py-1.5 rounded-xl shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add</span>
          </Link>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className="p-1.5 text-gray-600 active:bg-gray-100 rounded-xl transition-colors"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* ── Mobile Drawer ────────────────────────────────────── */}
      {isMenuOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/30 lg:hidden animate-in fade-in duration-150" 
            onClick={() => setIsMenuOpen(false)} 
          />
          <div className="fixed right-3 top-[58px] z-50 w-72 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl lg:hidden max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            {/* Active Plan summary */}
            <div className="rounded-xl bg-emerald-50/70 p-3.5 border border-emerald-100 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Plan</span>
                <span className="text-xs font-black text-[#1B4332]">{planDisplay[plan] || "Free Plan"}</span>
              </div>
              <p className="text-[11px] text-gray-600 mt-1">
                {listingCount} Active Listing{listingCount === 1 ? "" : "s"}
              </p>
              {plan === "free" && (
                <Link
                  href="/landlord/subscription"
                  onClick={() => setIsMenuOpen(false)}
                  className="mt-2 block text-center rounded-lg bg-[#F59E0B] py-1 text-xs font-black text-[#1B4332]"
                >
                  Upgrade to Pro
                </Link>
              )}
            </div>

            <nav className="flex flex-col space-y-3">
              {/* Workspace */}
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-2 pb-0.5">Workspace</p>
                {workspaceNav.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-bold text-gray-800 hover:bg-gray-50"
                  >
                    <item.icon className="h-4 w-4 text-[#1B4332]" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>

              {/* Account & Business */}
              <div className="space-y-1 pt-1 border-t border-gray-100">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-2 pb-0.5">Business</p>
                {businessNav.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between p-2 rounded-xl text-xs font-bold text-gray-800 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className="h-4 w-4 text-[#1B4332]" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>

              {/* Personal */}
              <div className="space-y-1 pt-1 border-t border-gray-100">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-2 pb-0.5">Personal</p>
                {personalNav.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 p-2 rounded-xl text-xs font-bold text-gray-800 hover:bg-gray-50"
                  >
                    <item.icon className="h-4 w-4 text-gray-500" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>

              {/* Sign Out */}
              <div className="border-t border-gray-100 pt-2">
                <button
                  onClick={onLogout}
                  className="flex items-center justify-center gap-2 w-full p-2.5 rounded-xl border border-red-100 text-red-600 font-bold text-xs hover:bg-red-50 transition"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </nav>
          </div>
        </>
      )}

      {/* ── Mobile Bottom Nav (lg:hidden) ────────────────────── */}
      <nav 
        aria-label="Landlord Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around bg-white/95 backdrop-blur-md border-t border-gray-100 px-2 pt-1 pb-safe shadow-[0_-1px_15px_rgba(0,0,0,0.06)]"
      >
        {[
          { href: "/landlord/dashboard", icon: LayoutDashboard, label: "Overview" },
          { href: "/landlord/analytics", icon: BarChart3, label: "Stats" },
          { href: "/landlord/listings/new", icon: Plus, label: "Add", highlight: true },
          { href: "/landlord/subscription", icon: CreditCard, label: "Plan" },
          { href: "/landlord/profile", icon: User, label: "Profile" },
        ].map((item) => {
          const Icon = item.icon
          const active = pathname === item.href

          if (item.highlight) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label="Add New Property Listing"
                className="flex h-12 w-12 -mt-6 items-center justify-center rounded-full bg-[#1B4332] text-white shadow-lg shadow-emerald-950/20 active:scale-90 transition-all border-4 border-white"
              >
                <Icon className="h-6 w-6" />
              </Link>
            )
          }

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
              <Icon className={`h-5 w-5 ${active ? "stroke-[2.4] scale-105" : "stroke-[1.8]"}`} />
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
