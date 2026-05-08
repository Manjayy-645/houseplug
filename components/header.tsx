"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { LogOut, Menu, X, Search } from "lucide-react"
import { usePathname } from "next/navigation"

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        supabase.from("profiles").select("role")
          .eq("id", session.user.id).single()
          .then(({ data }) => setRole(data?.role ?? "student"))
      }
    })
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  const isActive = (path: string) => pathname === path

  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-200">
      <div className="flex justify-between items-center h-16 px-5 md:px-20 max-w-7xl mx-auto">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold tracking-tight text-primary">
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

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <div className="flex items-center gap-4">
                {role === "admin" && (
                  <Link href="/admin/listings" className="text-sm font-semibold text-primary">Admin</Link>
                )}
                {role === "landlord" && (
                  <Link href="/landlord/dashboard" className="text-sm font-semibold text-primary">Dashboard</Link>
                )}
                <button 
                  onClick={handleLogout}
                  className="text-sm font-medium text-red-600 hover:text-red-700"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                Login
              </Link>
            )}
          </div>
          
          <Link 
            href="/browse"
            className="bg-secondary-container text-primary font-label-lg px-6 py-2.5 rounded-lg active:scale-95 transition-all shadow-sm hover:bg-secondary-container/90"
          >
            Find a Room
          </Link>

          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2">
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="fixed inset-0 top-[65px] z-40 bg-white/90 backdrop-blur-xl md:hidden animate-in slide-in-from-top duration-300">
          <nav className="flex flex-col h-full p-6 text-base font-semibold text-on-background">
            <div className="flex flex-col gap-6">
              <Link 
                href="/browse" 
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between border-b border-gray-50 pb-4"
              >
                <span>Browse Listings</span>
                <Search className="h-4 w-4 text-gray-400" />
              </Link>
              <Link 
                href="/signup" 
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between border-b border-gray-50 pb-4"
              >
                <span>List Property</span>
              </Link>
              <Link 
                href="/about" 
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between border-b border-gray-50 pb-4"
              >
                <span>About Us</span>
              </Link>
            </div>

            <div className="mt-8 flex flex-col gap-4">
              {user ? (
                <>
                  {role === "admin" && (
                    <Link 
                      href="/admin/listings" 
                      onClick={() => setIsOpen(false)}
                      className="rounded-xl bg-surface-container px-4 py-3 text-center"
                    >
                      Admin Panel
                    </Link>
                  )}
                  {role === "landlord" && (
                    <Link 
                      href="/landlord/dashboard" 
                      onClick={() => setIsOpen(false)}
                      className="rounded-xl bg-primary px-4 py-3 text-center text-white"
                    >
                      Dashboard
                    </Link>
                  )}
                  <button 
                    onClick={handleLogout} 
                    className="mt-4 flex items-center justify-center gap-2 text-red-600 font-bold"
                  >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl border-2 border-gray-100 px-4 py-3 text-center"
                  >
                    Login
                  </Link>
                  <Link 
                    href="/signup" 
                    onClick={() => setIsOpen(false)} 
                    className="rounded-xl bg-primary px-4 py-3 text-center text-white shadow-lg"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
