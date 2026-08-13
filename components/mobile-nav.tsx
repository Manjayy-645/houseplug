"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Users, User, Heart, LayoutDashboard } from "lucide-react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { UserRole } from "@/types"

export function MobileNav() {
  const pathname = usePathname()
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const supabase = createClient()
    
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()
        
        if (profile) setRole(profile.role)
      }
      setLoading(false)
    }
    
    fetchRole()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
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
        setRole(null)
        setLoading(false)
      }
    })
    
    return () => subscription.unsubscribe()
  }, [])
  
  // Hide bottom nav on specific auth pages, dashboard routes, and student routes
  // (student routes use their own StudentBottomNav)
  if (
    pathname === "/login" || 
    pathname === "/signup" || 
    pathname.startsWith("/landlord") || 
    pathname.startsWith("/admin") ||
    pathname.startsWith("/student")
  ) {
    return null
  }

  const isLandlord = role === "landlord" || role === "super_admin"
  const isStudent = role === "student"

  const navItems = [
    isStudent
      ? { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard }
      : { name: "Home", href: "/", icon: Home },
    { name: "Browse", href: "/browse", icon: Search },
    isLandlord 
      ? { name: "Dashboard", href: "/landlord/dashboard", icon: LayoutDashboard }
      : { name: "Roommates", href: "/roommates", icon: Users, highlight: true },
    { name: "Saved", href: isStudent ? "/student/saved" : "/saved", icon: Heart },
    { name: "Profile", href: isLandlord ? "/landlord/profile" : isStudent ? "/student/profile" : "/profile", icon: User },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe z-50 px-2 py-2 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] transition-opacity duration-300" style={{ opacity: loading ? 0 : 1 }}>
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex flex-col items-center justify-center w-16 h-12 relative ${isActive ? "text-primary" : "text-gray-400 hover:text-gray-600"}`}
            >
              {(item as any).highlight && !isActive && (
                <span className="absolute top-0 right-2 w-2.5 h-2.5 bg-[#F59E0B] rounded-full border-2 border-white animate-pulse"></span>
              )}
              <item.icon className={`h-5 w-5 mb-1 transition-transform ${isActive ? "scale-110" : ""}`} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] font-medium transition-colors ${isActive ? "font-bold" : ""}`}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
