"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { LogOut, Menu, X, Search, ChevronDown, Home, Settings, Share2, User, Heart } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { getInitials } from "@/lib/utils"
import type { Profile, UserRole } from "@/types"
import type { User as SupabaseUser } from "@supabase/supabase-js"

type ProfileSnippet = Pick<Profile, "full_name" | "role" | "avatar_url" | "username">

const roleBadgeConfig: Record<UserRole, { label: string; className: string }> = {
  student:     { label: "Student",    className: "bg-gray-100 text-gray-600"    },
  landlord:    { label: "Landlord",   className: "bg-green-100 text-green-700"  },
  agent:       { label: "Agent",      className: "bg-blue-100 text-blue-700"    },
  admin:       { label: "Admin",      className: "bg-blue-100 text-blue-700"    },
  super_admin: { label: "Super Admin",className: "bg-purple-100 text-purple-700"},
}

function RoleBadge({ role }: { role: UserRole }) {
  const { label, className } = roleBadgeConfig[role] ?? roleBadgeConfig.student
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${className}`}>
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
      style={{ width: size, height: size, fontSize: size * 0.33 }}
    >
      {avatarUrl && !imgError ? (
        <img
          src={avatarUrl}
          alt={profile?.full_name ?? "User"}
          className="absolute inset-0 w-full h-full object-cover cursor-pointer"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="select-none">{initials}</span>
      )}
    </div>
  )
}

function getProfileHref(role: UserRole | null | undefined): string {
  if (role === "landlord" || role === "super_admin") return "/landlord/profile"
  if (role === "admin") return "/admin"
  return "/profile"
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

    // NOTE: Never `await` Supabase data calls directly inside the
    // onAuthStateChange callback — it runs while the auth library holds an
    // internal lock, and awaiting a query here deadlocks it. The fetch never
    // resolves, so `profile` stays null and the avatar <img> never mounts.
    // Defer the fetch out of the callback with setTimeout(0) to release the lock.
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

  useEffect(() => {
    if (!dropdownOpen) return
    const close = () => setDropdownOpen(false)
    document.addEventListener("click", close)
    return () => document.removeEventListener("click", close)
  }, [dropdownOpen])

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

  const isActive = (path: string) => pathname === path
  const role = profile?.role ?? null

  return (
    <header className="fixed top-0 w-full z-50 bg-white border-b border-gray-100 shadow-sm transition-all duration-200">
      <div className="flex justify-between items-center h-16 px-5 md:px-20 max-w-7xl mx-auto">

        {/* Logo + desktop nav links */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
            <Image src="/logo.png" alt="HousePlug Logo" width={32} height={32} className="rounded-lg" />
            HousePlug
          </Link>
          <div className="hidden md:flex gap-6 items-center">
            <Link
              href="/browse"
              className={`text-sm font-semibold py-1 transition-colors ${
                isActive("/browse")
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-600 hover:text-primary"
              }`}
            >
              Browse Listings
            </Link>
            <Link
              href="/roommates"
              className={`text-sm font-semibold py-1 transition-colors ${
                isActive("/roommates")
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-600 hover:text-primary"
              }`}
            >
              Find Roommate
            </Link>
            <Link
              href="/signup"
              className={`text-sm font-medium transition-colors ${
                isActive("/signup")
                  ? "text-primary font-semibold"
                  : "text-gray-600 hover:text-primary"
              }`}
            >
              List Property
            </Link>
          </div>
        </div>

        {/* Right: auth button + mobile hamburger */}
        <div className="flex items-center gap-2 md:gap-4">

          {/* Auth control (always visible) */}
          <div className="flex items-center">
            {loading ? (
              <div className="w-9 h-9 rounded-full bg-gray-100 animate-pulse" />
            ) : !user ? (
              <a
                href="/signup"
                className="bg-[#F59E0B] text-white px-4 py-2 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
              >
                Sign Up
              </a>
            ) : (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setDropdownOpen((prev) => !prev)
                  }}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  aria-label="Account menu"
                >
                  <UserAvatar profile={profile} />
                  <ChevronDown
                    className={`h-3 w-3 text-gray-500 transition-transform duration-150 ${
                      dropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 min-w-[200px] z-50 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Profile header */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-sm text-gray-900 truncate">
                        {profile?.full_name ?? user.email}
                      </p>
                      {role && (
                        <div className="mt-1">
                          <RoleBadge role={role} />
                        </div>
                      )}
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      {(role === "landlord" || role === "super_admin") && (
                        <Link
                          href="/landlord/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700"
                        >
                          <Home className="h-4 w-4 shrink-0" /> My Dashboard
                        </Link>
                      )}
                      {(role === "admin" || role === "super_admin") && (
                        <Link
                          href="/admin/listings"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700"
                        >
                          <Settings className="h-4 w-4 shrink-0" /> Admin Panel
                        </Link>
                      )}
                      {role === "landlord" && (
                        <Link
                          href="/landlord/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700"
                        >
                          <Share2 className="h-4 w-4 shrink-0" /> My Card
                        </Link>
                      )}
                      <Link
                        href={getProfileHref(role)}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700"
                      >
                        <User className="h-4 w-4 shrink-0" /> My Profile
                      </Link>
                      <Link
                        href="/saved"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700"
                      >
                        <Heart className="h-4 w-4 shrink-0" /> Saved Lodges
                      </Link>

                      <div className="border-t border-gray-100 my-1" />

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-sm text-red-500"
                      >
                        <LogOut className="h-4 w-4 shrink-0" /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2">
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="fixed inset-0 top-[65px] z-40 bg-white md:hidden animate-in slide-in-from-top duration-300 overflow-y-auto">
          <nav className="flex flex-col p-6 pb-20 text-base font-semibold text-on-background">

            {/* Logged-in user info */}
            {!loading && user && (
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                <UserAvatar profile={profile} size={44} />
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 truncate">
                    {profile?.full_name || user.email?.split("@")[0] || "User"}
                  </p>
                  {role && (
                    <div className="mt-1">
                      <RoleBadge role={role} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Nav links */}
            <div className="flex flex-col gap-2">
              <Link
                href="/browse"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between bg-gray-50/50 hover:bg-gray-100 p-4 rounded-2xl transition-colors"
              >
                <span className="text-gray-700 font-bold">Browse Listings</span>
                <Search className="h-5 w-5 text-gray-400" />
              </Link>
              <Link
                href="/roommates"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between bg-gray-50/50 hover:bg-gray-100 p-4 rounded-2xl transition-colors"
              >
                <span className="text-gray-700 font-bold">Find Roommate</span>
              </Link>
              <Link
                href="/signup"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between bg-gray-50/50 hover:bg-gray-100 p-4 rounded-2xl transition-colors"
              >
                <span className="text-gray-700 font-bold">List Property</span>
              </Link>
              <Link
                href="/about"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between bg-gray-50/50 hover:bg-gray-100 p-4 rounded-2xl transition-colors"
              >
                <span className="text-gray-700 font-bold">About Us</span>
              </Link>
            </div>

            {/* Auth actions */}
            <div className="mt-8 flex flex-col gap-3">
              {loading ? (
                <div className="h-12 rounded-xl bg-gray-100 animate-pulse" />
              ) : user ? (
                <>
                  {(role === "landlord" || role === "super_admin") && (
                    <Link
                      href="/landlord/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="rounded-xl bg-primary px-4 py-3 text-center text-white text-sm"
                    >
                      <span className="inline-flex items-center justify-center gap-2"><Home className="h-4 w-4" /> My Dashboard</span>
                    </Link>
                  )}
                  {(role === "admin" || role === "super_admin") && (
                    <Link
                      href="/admin/listings"
                      onClick={() => setIsOpen(false)}
                      className="rounded-xl bg-surface-container px-4 py-3 text-center text-sm"
                    >
                      <span className="inline-flex items-center justify-center gap-2"><Settings className="h-4 w-4" /> Admin Panel</span>
                    </Link>
                  )}
                  {role === "landlord" && (
                    <Link
                      href="/landlord/profile"
                      onClick={() => setIsOpen(false)}
                      className="rounded-xl border border-gray-100 px-4 py-3 text-center text-sm"
                    >
                      <span className="inline-flex items-center justify-center gap-2"><Share2 className="h-4 w-4" /> My Card</span>
                    </Link>
                  )}
                  <Link
                    href={getProfileHref(role)}
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl border border-gray-100 px-4 py-3 text-center text-sm"
                  >
                    <span className="inline-flex items-center justify-center gap-2"><User className="h-4 w-4" /> My Profile</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="mt-2 flex items-center justify-center gap-2 text-red-600 font-bold text-sm"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="rounded-2xl border-2 border-primary text-primary px-4 py-3.5 text-center font-bold text-base hover:bg-primary/5 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setIsOpen(false)}
                    className="rounded-2xl bg-[#F59E0B] px-4 py-3.5 text-center text-white font-bold shadow-lg shadow-amber-500/20 hover:brightness-105 transition-all text-base"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
