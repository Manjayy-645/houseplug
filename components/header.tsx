"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  LogOut, 
  Menu, 
  X, 
  Search, 
  ChevronDown, 
  LayoutDashboard, 
  ShieldCheck, 
  Settings, 
  User, 
  Heart, 
  Wrench, 
  PlusCircle, 
  Sparkles,
  HelpCircle,
  Building2,
  Users
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { getInitials } from "@/lib/utils"
import type { Profile, UserRole } from "@/types"
import type { User as SupabaseUser } from "@supabase/supabase-js"

type ProfileSnippet = Pick<Profile, "full_name" | "role" | "avatar_url" | "username">

const roleBadgeConfig: Record<UserRole, { label: string; className: string }> = {
  student:     { label: "Student",     className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  landlord:    { label: "Landlord",    className: "bg-emerald-100 text-[#1B4332] border-emerald-300" },
  agent:       { label: "Agent",       className: "bg-blue-50 text-blue-700 border-blue-200" },
  admin:       { label: "Admin",       className: "bg-amber-50 text-amber-800 border-amber-200" },
  super_admin: { label: "Super Admin", className: "bg-purple-50 text-purple-700 border-purple-200" },
}

function RoleBadge({ role }: { role: UserRole }) {
  const { label, className } = roleBadgeConfig[role] ?? roleBadgeConfig.student
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${className}`}>
      {label}
    </span>
  )
}

function UserAvatar({ profile, size = 36 }: { profile: ProfileSnippet | null; size?: number }) {
  const [imgError, setImgError] = useState(false)
  const initials = profile?.full_name?.trim() ? getInitials(profile.full_name) : "U"
  const avatarUrl = profile?.avatar_url

  useEffect(() => {
    setImgError(false)
  }, [avatarUrl])

  return (
    <div
      className="relative shrink-0 rounded-full flex items-center justify-center bg-[#1B4332] text-white font-bold border-2 border-[#F59E0B] overflow-hidden"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {avatarUrl && !imgError ? (
        <img
          src={avatarUrl}
          alt={profile?.full_name ?? "User"}
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="select-none tracking-tight">{initials}</span>
      )}
    </div>
  )
}

function getProfileHref(role: UserRole | null | undefined): string {
  if (role === "landlord" || role === "super_admin") return "/landlord/profile"
  if (role === "admin") return "/admin/settings"
  if (role === "student") return "/student/profile"
  return "/profile"
}

function getDashboardHref(role: UserRole | null | undefined): string {
  if (role === "landlord" || role === "super_admin") return "/landlord/dashboard"
  if (role === "admin") return "/admin"
  if (role === "student") return "/student/dashboard"
  return "/browse"
}

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<ProfileSnippet | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const fetchProfile = async (userId: string) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, role, avatar_url, username")
        .eq("id", userId)
        .single()

      if (profile) setProfile(profile)
    }

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        await fetchProfile(user.id)
      }
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        setTimeout(() => {
          fetchProfile(session.user.id)
        }, 0)
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Close menus on outside click or navigation
  useEffect(() => {
    if (!dropdownOpen) return
    const close = () => setDropdownOpen(false)
    document.addEventListener("click", close)
    return () => document.removeEventListener("click", close)
  }, [dropdownOpen])

  useEffect(() => {
    setIsOpen(false)
    setDropdownOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setDropdownOpen(false)
    setIsOpen(false)
    router.push("/")
    router.refresh()
  }

  const role = profile?.role ?? null
  const isAgentOrLandlord = role === "landlord" || role === "agent"
  const isAdmin = role === "admin" || role === "super_admin"

  const isExploreActive = pathname === "/browse" || pathname.startsWith("/listing/")
  const isRoommatesActive = pathname.startsWith("/roommates")
  const isServicesActive = pathname.startsWith("/services")

  const listPropertyHref = isAgentOrLandlord 
    ? "/landlord/listings/new" 
    : user 
    ? "/landlord/dashboard" 
    : "/signup?role=landlord"

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all duration-200">
      <div className="flex justify-between items-center h-16 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">

        {/* Brand Logo & Primary Desktop Nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-[#1B4332] group">
            <Image 
              src="/logo.png" 
              alt="HousePlug Logo" 
              width={34} 
              height={34} 
              className="rounded-xl shadow-xs group-hover:scale-105 transition-transform" 
            />
            <span className="font-extrabold text-lg text-[#1B4332]">HousePlug</span>
          </Link>

          {/* Primary Destinations */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-1.5 lg:gap-2">
            <Link
              href="/browse"
              className={`text-sm font-semibold px-3.5 py-1.5 rounded-full transition-all ${
                isExploreActive
                  ? "bg-[#1B4332]/10 text-[#1B4332] font-bold"
                  : "text-gray-600 hover:text-gray-950 hover:bg-gray-100/70"
              }`}
            >
              Explore
            </Link>

            <Link
              href="/roommates"
              className={`text-sm font-semibold px-3.5 py-1.5 rounded-full transition-all ${
                isRoommatesActive
                  ? "bg-[#1B4332]/10 text-[#1B4332] font-bold"
                  : "text-gray-600 hover:text-gray-950 hover:bg-gray-100/70"
              }`}
            >
              Roommates
            </Link>

            <Link
              href="/services"
              className={`text-sm font-semibold px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                isServicesActive
                  ? "bg-[#1B4332]/10 text-[#1B4332] font-bold"
                  : "text-gray-600 hover:text-gray-950 hover:bg-gray-100/70"
              }`}
            >
              <span>Services</span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-[#1B4332] border border-emerald-200">
                New
              </span>
            </Link>
          </nav>
        </div>

        {/* Right Section: Community Action + List Property CTA + Account */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          
          {/* Community WhatsApp Channel (Subtle, non-competing) */}
          <a
            href="https://whatsapp.com/channel/0029VbCtrHY7oQhhDU4qIC0I"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-[#25D366]/40 hover:text-[#128C5E] hover:bg-emerald-50/40 transition-colors"
            title="Join the HousePlug student WhatsApp community channel"
            aria-label="Join HousePlug WhatsApp Channel"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#25D366] shrink-0" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.857L.054 23.338a.75.75 0 0 0 .916.916l5.481-1.478A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.694 9.694 0 0 1-4.95-1.357l-.355-.212-3.683.993.992-3.617-.232-.373A9.694 9.694 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
            </svg>
            <span>Channel</span>
          </a>

          {/* List Property CTA (Accessible for agents/landlords) */}
          <Link
            href={listPropertyHref}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl text-[#1B4332] bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 transition-colors"
          >
            <Building2 className="w-3.5 h-3.5 text-[#1B4332]" />
            <span>List Property</span>
          </Link>

          {/* Auth Controls */}
          {loading ? (
            <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
          ) : !user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs sm:text-sm font-bold text-gray-700 hover:text-[#1B4332] px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="bg-[#F59E0B] text-white px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm shadow-sm hover:brightness-105 active:scale-95 transition-all"
              >
                Sign Up
              </Link>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setDropdownOpen((prev) => !prev)
                }}
                className="flex items-center gap-1.5 p-1 rounded-full hover:bg-gray-100/80 transition-colors"
                aria-label="User Account Menu"
                aria-expanded={dropdownOpen}
              >
                <UserAvatar profile={profile} size={36} />
                <ChevronDown
                  className={`h-3.5 w-3.5 text-gray-500 transition-transform duration-200 ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* User Dropdown Menu */}
              {dropdownOpen && (
                <div
                  className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Account Header */}
                  <div className="p-4 bg-gray-50/70 border-b border-gray-100">
                    <p className="font-bold text-sm text-gray-900 truncate">
                      {profile?.full_name ?? user.email?.split("@")[0] ?? "My Account"}
                    </p>
                    <p className="text-xs text-gray-500 truncate mb-1.5">
                      {user.email}
                    </p>
                    {role && <RoleBadge role={role} />}
                  </div>

                  {/* Menu Destinations */}
                  <div className="p-1.5 space-y-0.5">
                    <Link
                      href={getDashboardHref(role)}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4 text-[#1B4332]" />
                      <span>My Dashboard</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
                      >
                        <Settings className="h-4 w-4 text-purple-600" />
                        <span>Admin Panel</span>
                      </Link>
                    )}

                    {isAgentOrLandlord && (
                      <Link
                        href="/landlord/listings/new"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
                      >
                        <PlusCircle className="h-4 w-4 text-[#10B981]" />
                        <span>Add New Listing</span>
                      </Link>
                    )}

                    <Link
                      href={role === "student" ? "/student/saved" : "/saved"}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
                    >
                      <Heart className="h-4 w-4 text-rose-500" />
                      <span>Saved Rooms</span>
                    </Link>

                    <Link
                      href={getProfileHref(role)}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
                    >
                      <User className="h-4 w-4 text-gray-500" />
                      <span>Profile &amp; Settings</span>
                    </Link>

                    <div className="border-t border-gray-100 my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-50 text-sm font-medium text-red-600 transition-colors text-left"
                    >
                      <LogOut className="h-4 w-4 text-red-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile Drawer Hamburger */}
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="md:hidden p-2 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label={isOpen ? "Close main menu" : "Open main menu"}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer (Clean, Non-overlapping) */}
      {isOpen && (
        <div className="fixed inset-0 top-16 z-40 bg-black/30 md:hidden animate-in fade-in duration-200">
          <div 
            className="absolute top-0 right-0 bottom-0 w-5/6 max-w-sm bg-white shadow-2xl p-5 overflow-y-auto flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-5">
              {/* User info card or login prompts */}
              {!loading && user ? (
                <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                  <UserAvatar profile={profile} size={42} />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 text-sm truncate">
                      {profile?.full_name || user.email?.split("@")[0]}
                    </p>
                    <p className="text-xs text-gray-500 truncate mb-1">
                      {user.email}
                    </p>
                    {role && <RoleBadge role={role} />}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-center space-y-2.5">
                  <p className="text-sm font-bold text-[#1B4332]">Welcome to HousePlug</p>
                  <p className="text-xs text-gray-600">Off-campus housing near Port Harcourt universities</p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      href="/login"
                      onClick={() => setIsOpen(false)}
                      className="py-2 px-3 text-center rounded-xl bg-white text-[#1B4332] text-xs font-bold border border-emerald-200 shadow-2xs"
                    >
                      Log In
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setIsOpen(false)}
                      className="py-2 px-3 text-center rounded-xl bg-[#F59E0B] text-white text-xs font-bold shadow-2xs hover:brightness-105"
                    >
                      Sign Up
                    </Link>
                  </div>
                </div>
              )}

              {/* Navigation Items */}
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-3 pb-1">
                  Explore Accommodation
                </p>
                <Link
                  href="/browse"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold transition-colors ${
                    isExploreActive ? "bg-[#1B4332] text-white" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Search className="h-4 w-4" />
                  <span>Browse Listings</span>
                </Link>

                <Link
                  href="/roommates"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold transition-colors ${
                    isRoommatesActive ? "bg-[#1B4332] text-white" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>Find Roommates</span>
                </Link>

                <Link
                  href="/services"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold transition-colors ${
                    isServicesActive ? "bg-[#1B4332] text-white" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Wrench className="h-4 w-4" />
                    <span>Campus Services</span>
                  </div>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-[#1B4332]">
                    New
                  </span>
                </Link>

                <Link
                  href={listPropertyHref}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Building2 className="h-4 w-4 text-[#1B4332]" />
                  <span>List a Property</span>
                </Link>
              </div>

              {/* Account Quick Links if Authenticated */}
              {user && (
                <div className="space-y-1 pt-2 border-t border-gray-100">
                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-3 pb-1">
                    My Account
                  </p>
                  <Link
                    href={getDashboardHref(role)}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50"
                  >
                    <LayoutDashboard className="h-4 w-4 text-[#1B4332]" />
                    <span>Dashboard</span>
                  </Link>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50"
                    >
                      <Settings className="h-4 w-4 text-purple-600" />
                      <span>Admin Portal</span>
                    </Link>
                  )}

                  <Link
                    href={role === "student" ? "/student/saved" : "/saved"}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50"
                  >
                    <Heart className="h-4 w-4 text-rose-500" />
                    <span>Saved Rooms</span>
                  </Link>

                  <Link
                    href={getProfileHref(role)}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50"
                  >
                    <User className="h-4 w-4 text-gray-500" />
                    <span>Profile &amp; Settings</span>
                  </Link>
                </div>
              )}

              {/* Community & Support */}
              <div className="space-y-1 pt-2 border-t border-gray-100">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 px-3 pb-1">
                  Community &amp; Safety
                </p>
                <a
                  href="https://whatsapp.com/channel/0029VbCtrHY7oQhhDU4qIC0I"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-[#128C5E] hover:bg-emerald-50 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#25D366] shrink-0" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.857L.054 23.338a.75.75 0 0 0 .916.916l5.481-1.478A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.694 9.694 0 0 1-4.95-1.357l-.355-.212-3.683.993.992-3.617-.232-.373A9.694 9.694 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
                  </svg>
                  <span>WhatsApp Channel</span>
                </a>

                <Link
                  href="/safety"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Safety Guide</span>
                </Link>

                <Link
                  href="/contact"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  <HelpCircle className="h-4 w-4 text-gray-500" />
                  <span>Contact Support</span>
                </Link>
              </div>
            </div>

            {/* Logout button if authenticated */}
            {user && (
              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full p-3 rounded-xl border border-red-100 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
