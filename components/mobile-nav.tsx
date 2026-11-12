"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, Users, User, Heart, Wrench, LayoutDashboard } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { UserRole } from "@/types"

export function MobileNav({ servicesEnabled = true }: { servicesEnabled?: boolean } = {}) {
  const pathname = usePathname()
  const [role, setRole] = useState<UserRole | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const fetchUserAndRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setIsAuthenticated(true)
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()

        if (profile) setRole(profile.role)
      } else {
        setIsAuthenticated(false)
        setRole(null)
      }
      setLoading(false)
    }

    fetchUserAndRole()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsAuthenticated(true)
        setTimeout(async () => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single()
          if (profile) setRole(profile.role)
          setLoading(false)
        }, 0)
      } else {
        setIsAuthenticated(false)
        setRole(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Hide on auth flows, full dedicated dashboards, and listing details (which has sticky contact bar)
  if (
    !pathname ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/banned" ||
    pathname === "/appeal" ||
    pathname === "/maintenance" ||
    pathname === "/offline" ||
    pathname.startsWith("/landlord") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/student") ||
    pathname.startsWith("/listing/")
  ) {
    return null
  }

  const getAccountHref = () => {
    if (!isAuthenticated) return "/login"
    if (role === "student") return "/student/dashboard"
    if (role === "landlord" || role === "agent") return "/landlord/dashboard"
    if (role === "admin" || role === "super_admin") return "/admin"
    return "/profile"
  }

  const savedHref = role === "student" ? "/student/saved" : "/saved"

  const navItems = [
    {
      name: "Explore",
      href: "/browse",
      icon: Search,
      isActive: pathname === "/" || pathname === "/browse",
      badge: null,
    },
    {
      name: "Roommates",
      href: "/roommates",
      icon: Users,
      isActive: pathname.startsWith("/roommates"),
      badge: null,
    },
    ...(servicesEnabled
      ? [
          {
            name: "Services",
            href: "/services",
            icon: Wrench,
            isActive: pathname.startsWith("/services"),
            badge: "NEW" as const,
          },
        ]
      : []),
    {
      name: "Saved",
      href: savedHref,
      icon: Heart,
      isActive: pathname === "/saved" || pathname === "/student/saved",
      badge: null,
    },
    {
      name: isAuthenticated ? "Account" : "Log In",
      href: getAccountHref(),
      icon: isAuthenticated ? LayoutDashboard : User,
      isActive:
        pathname === "/profile" ||
        pathname.startsWith("/student/dashboard") ||
        pathname.startsWith("/landlord/dashboard") ||
        pathname.startsWith("/admin"),
      badge: null,
    },
  ]

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 z-50 px-2 pt-1 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)] transition-opacity duration-200"
      style={{ opacity: loading ? 0 : 1 }}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = item.isActive

          return (
            <Link
              key={item.name}
              href={item.href}
              aria-label={item.name}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-col items-center justify-center min-w-[56px] min-h-[50px] py-1 px-2 rounded-xl transition-all active:scale-95 ${
                active ? "text-[#1B4332]" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <div className="relative">
                <Icon
                  className={`h-5 w-5 transition-transform ${active ? "scale-110 stroke-[2.4]" : "stroke-[1.8]"}`}
                />
                {item.badge && !active && (
                  <span className="absolute -top-1.5 -right-3 px-1 py-0.2 rounded-full bg-[#1B4332] text-[#F59E0B] text-[7px] font-black tracking-wider leading-none shadow-xs border border-emerald-500/40">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] tracking-tight mt-1 transition-colors ${
                  active ? "font-bold text-[#1B4332]" : "font-medium text-gray-500"
                }`}
              >
                {item.name}
              </span>
              {active && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-[#1B4332] rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
