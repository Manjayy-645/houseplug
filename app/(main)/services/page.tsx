"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Wrench,
  Plus,
  Search,
  Filter,
  Check,
  Building,
  GraduationCap,
  Sparkles,
  Star,
  Zap,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ServiceCard } from "@/components/services/service-card"
import { SERVICE_CATEGORIES, SERVICE_UNIVERSITIES } from "@/lib/service-utils"
import type { ServiceProvider, ServiceCategory } from "@/types"

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [hasService, setHasService] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedUniversity, setSelectedUniversity] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Check user session & if they already have a service
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setIsLoggedIn(!!user)
      if (user) {
        const { data } = await supabase
          .from("service_providers")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle()
        setHasService(!!data)
      }
    })
  }, [])

  // Fetch active services (excluding expired ones)
  useEffect(() => {
    async function fetchServices() {
      setLoading(true)
      try {
        const supabase = createClient()
        let query = supabase
          .from("service_providers")
          .select("*")
          .eq("status", "active")
          .order("is_boosted", { ascending: false })
          .order("is_verified", { ascending: false })
          .order("vouch_count", { ascending: false })
          .order("created_at", { ascending: false })

        let { data, error } = await query

        if (error && (error.message?.includes("is_boosted") || error.message?.includes("schema cache"))) {
          const fallbackQuery = supabase
            .from("service_providers")
            .select("*")
            .eq("status", "active")
            .order("is_verified", { ascending: false })
            .order("vouch_count", { ascending: false })
            .order("created_at", { ascending: false })
          const fallbackRes = await fallbackQuery
          data = fallbackRes.data
          error = fallbackRes.error
        }

        if (!error && data) {
          // Filter out expired listings if listing_expires_at is set in the past
          const now = new Date()
          const activeListings = (data as ServiceProvider[]).filter((srv) => {
            if (srv.listing_expires_at && new Date(srv.listing_expires_at) < now) {
              return false
            }
            return true
          })
          setServices(activeListings)
        }
      } catch (err) {
        console.error("Failed to load services", err)
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [])

  // Boosted / Spotlight services (active boost)
  const boostedServices = services.filter((srv) => {
    if (!srv.is_boosted) return false
    if (srv.boost_expires_at && new Date(srv.boost_expires_at) < new Date()) {
      return false
    }
    return true
  })

  // Client-side filtering
  const filteredServices = services.filter((srv) => {
    // Category filter
    if (selectedCategory !== "all" && srv.category !== selectedCategory) {
      return false
    }

    // University filter
    if (selectedUniversity !== "all" && srv.university !== selectedUniversity) {
      return false
    }

    // Search query filter
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase()
      const matchName = srv.business_name?.toLowerCase().includes(q)
      const matchDesc = srv.description?.toLowerCase().includes(q)
      const matchUni = srv.university?.toLowerCase().includes(q)
      const matchCustom = srv.custom_category_name?.toLowerCase().includes(q)
      if (!matchName && !matchDesc && !matchUni && !matchCustom) {
        return false
      }
    }

    return true
  })

  // Dynamic CTA button destination & text
  const listServiceHref = isLoggedIn
    ? "/services/manage"
    : "/signup?role=service_provider"

  const listServiceText = hasService ? "Manage My Service" : "+ List Your Service"

  return (
    <div className="min-h-screen bg-[#F9FAFB] pt-16 sm:pt-20 pb-28 sm:pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1B4332] text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Hero / Header Banner */}
      <section className="bg-gradient-to-b from-white to-[#F9FAFB] border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-14">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#1B4332] text-[11px] sm:text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" /> Campus Marketplace
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">
                Verified Campus Services
              </h1>
              <p className="text-xs sm:text-base text-gray-600 leading-relaxed">
                Trusted movers, lodge cleaners, gas delivery, technicians & student vendors around UniPort & RSU.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              <Link
                href={listServiceHref}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#1B4332] text-white font-bold text-xs sm:text-sm px-5 py-3 sm:px-6 sm:py-3.5 rounded-xl sm:rounded-2xl hover:bg-[#143728] transition-all shadow-md shadow-[#1B4332]/20 hover:shadow-lg hover:shadow-[#1B4332]/30 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                {listServiceText}
              </Link>
            </div>
          </div>

          {/* Quick Search Bar */}
          <div className="mt-5 sm:mt-8 max-w-xl relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services (e.g. gas, cleaner, photography, keke, repairs)..."
              className="w-full bg-white border border-gray-200 pl-11 pr-12 py-3 rounded-xl sm:rounded-2xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-gray-600 p-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        {/* SPOTLIGHT SECTION: Boosted / Featured Services Carousel */}
        {boostedServices.length > 0 && selectedCategory === "all" && !searchQuery && (
          <section className="space-y-3 sm:space-y-4 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-amber-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-xs">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight flex items-center gap-1.5 sm:gap-2">
                    Featured Spotlight
                    <span className="text-[9px] sm:text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full uppercase">
                      Promoted
                    </span>
                  </h2>
                  <p className="text-[11px] sm:text-xs text-gray-600">Top recommended campus service providers this week</p>
                </div>
              </div>

              <Link
                href="/services/manage"
                className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-amber-800 hover:text-amber-950 transition-colors shrink-0"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden xs:inline">Boost your service</span>
                <span className="xs:hidden">Boost</span>
              </Link>
            </div>

            {/* Mobile Horizontal Snap Carousel / Desktop Grid */}
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-3.5 pb-2 scrollbar-none no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible pt-1">
              {boostedServices.slice(0, 3).map((service) => (
                <div key={`boosted-${service.id}`} className="w-[84vw] xs:w-[300px] shrink-0 snap-center sm:w-auto">
                  <ServiceCard
                    service={service}
                    onToast={showToast}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Filters Controls */}
        <div className="space-y-3 sm:space-y-4">
          {/* University Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider shrink-0 mr-0.5 flex items-center gap-1">
              <Building className="w-3.5 h-3.5" /> Campus:
            </span>
            <button
              type="button"
              onClick={() => setSelectedUniversity("all")}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedUniversity === "all"
                  ? "bg-[#1B4332] text-white shadow-xs"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300 active:bg-gray-50"
              }`}
            >
              All Campuses
            </button>
            {SERVICE_UNIVERSITIES.map((uni) => (
              <button
                key={uni}
                type="button"
                onClick={() => setSelectedUniversity(uni)}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-xl font-bold transition-all ${
                  selectedUniversity === uni
                    ? "bg-[#1B4332] text-white shadow-xs"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300 active:bg-gray-50"
                }`}
              >
                {uni === "University of Port Harcourt"
                  ? "UniPort"
                  : uni === "Rivers State University"
                  ? "RSU"
                  : uni}
              </button>
            ))}
          </div>

          {/* Horizontal Category Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 scrollbar-none no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`shrink-0 text-xs px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full font-bold transition-all ${
                selectedCategory === "all"
                  ? "bg-[#F59E0B] text-white shadow-xs"
                  : "bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              All Services
            </button>
            {SERVICE_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 text-xs px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full font-bold transition-all flex items-center gap-1.5 ${
                    active
                      ? "bg-[#1B4332] text-white shadow-xs"
                      : "bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {cat.shortLabel}
                </button>
              )
            })}
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
          <span>
            Showing <strong className="text-gray-900">{filteredServices.length}</strong>{" "}
            {filteredServices.length === 1 ? "service" : "services"}
          </span>
          {(selectedCategory !== "all" || selectedUniversity !== "all" || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all")
                setSelectedUniversity("all")
                setSearchQuery("")
              }}
              className="text-[#1B4332] font-semibold hover:underline"
            >
              Reset all filters
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-80 rounded-2xl bg-white border border-gray-100 p-4 animate-pulse space-y-4"
              >
                <div className="h-44 bg-gray-100 rounded-xl" />
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 px-4 bg-white rounded-3xl border border-gray-100 max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#1B4332] flex items-center justify-center mx-auto">
              <Wrench className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-gray-900 text-lg">No services found</h3>
              <p className="text-sm text-gray-500">
                {searchQuery || selectedCategory !== "all" || selectedUniversity !== "all"
                  ? "Try adjusting your filters or search keywords."
                  : "Be the first student or vendor to list your campus service!"}
              </p>
            </div>
            <div className="pt-2">
              <Link
                href={listServiceHref}
                className="inline-flex items-center gap-2 bg-[#1B4332] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#143728] transition-colors"
              >
                <Plus className="w-4 h-4" />
                {listServiceText}
              </Link>
            </div>
          </div>
        ) : (
          /* Services Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pt-1 sm:pt-2">
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onToast={showToast}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
