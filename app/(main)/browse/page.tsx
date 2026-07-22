import Link from "next/link"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { FilterSidebar } from "@/components/filter-sidebar"
import { ListingCard } from "@/components/listing-card"
import { SearchBar } from "@/components/search-bar"
import { createClient } from "@/lib/supabase/server"
import { UNIVERSITIES } from "@/lib/constants"
import type { Listing } from "@/types"

type BrowsePageProps = {
  searchParams: {
    q?: string
    university?: string
    room_type?: string
    min_price?: string
    max_price?: string
    distance?: string
    landlord_id?: string
    sort?: "newest" | "price_asc" | "price_desc"
    page?: string
  }
}

const PER_PAGE = 12

export const revalidate = 60 // revalidate every 60 seconds

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const supabase = createClient()

  const q = searchParams.q?.trim()
  const university = searchParams.university?.trim()
  const roomType = searchParams.room_type?.trim()
  const minPrice = Number(searchParams.min_price)
  const maxPrice = Number(searchParams.max_price)
  const distance = searchParams.distance?.trim()
  const landlordId = searchParams.landlord_id?.trim()
  const sort = searchParams.sort ?? "newest"
  const page = Math.max(Number(searchParams.page) || 1, 1)
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  let query = supabase
    .from("listings")
    .select(`
      *,
      landlord:profiles(full_name, verification_status, role),
      reviews(rating)
    `, { count: "exact" })
    .eq("status", "active")

  if (q) {
    query = query.or(`address.ilike.%${q}%,area.ilike.%${q}%,landmark.ilike.%${q}%,title.ilike.%${q}%`)
  }
  if (university) query = query.eq("university", university)
  if (roomType) query = query.eq("room_type", roomType)
  if (!Number.isNaN(minPrice) && minPrice > 0) query = query.gte("price_yearly", minPrice)
  if (!Number.isNaN(maxPrice) && maxPrice > 0) query = query.lte("price_yearly", maxPrice)
  if (distance) query = query.eq("distance_from_gate", distance)
  if (landlordId) query = query.eq("landlord_id", landlordId)

  query = query.order("is_featured", { ascending: false })
  query = query.order("is_urgent", { ascending: false })
  if (sort === "price_asc") query = query.order("price_yearly", { ascending: true })
  else if (sort === "price_desc") query = query.order("price_yearly", { ascending: false })
  else query = query.order("created_at", { ascending: false })

  const { data, count } = await query.range(from, to)
  const listings = (data ?? []) as unknown as Listing[]
  const total = count ?? 0
  const totalPages = Math.max(Math.ceil(total / PER_PAGE), 1)

  const selectedUniversity = UNIVERSITIES.find(u => u.id === university)

  const previousPage = Math.max(page - 1, 1)
  const nextPage = Math.min(page + 1, totalPages)
  const buildPageLink = (targetPage: number) => {
    const params = new URLSearchParams()
    Object.entries(searchParams).forEach(([key, value]) => {
      if (!value) return
      params.set(key, value)
    })
    if (targetPage > 1) params.set("page", String(targetPage))
    else params.delete("page")
    return `/browse?${params.toString()}`
  }

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, 4, "ellipsis", totalPages)
      } else if (page >= totalPages - 2) {
        pages.push(1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        pages.push(1, "ellipsis", page - 1, page, page + 1, "ellipsis", totalPages)
      }
    }
    return pages
  }

  return (
    <main className="min-h-screen bg-[#F9FAFB] px-4 py-8 pt-24 lg:px-6 lg:pt-28">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex flex-col gap-3 lg:block rounded-2xl border border-gray-200 bg-white p-3 lg:p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SearchBar />
            </div>
            <div className="lg:hidden shrink-0">
              <FilterSidebar />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px,1fr]">
          <div className="hidden lg:block">
            <FilterSidebar />
          </div>

          <section className="space-y-4">
            <div className="flex flex-col gap-2 px-1">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                {selectedUniversity 
                  ? `Rooms near ${selectedUniversity.shortName}` 
                  : "All Student Rooms in Port Harcourt"}
              </h1>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-600">
                  {total} {total === 1 ? "room" : "rooms"} found
                  {selectedUniversity ? ` near ${selectedUniversity.shortName}` : ""}
                </p>
                <div className="hidden sm:block text-xs text-gray-500 bg-emerald-50 px-2 py-1 rounded-full text-emerald-700 font-semibold border border-emerald-100">Featured first</div>
              </div>
            </div>

            {listings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                <p className="text-base font-medium text-gray-800">
                  No rooms found. Try a different search or adjust your filters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}

            {totalPages > 1 ? (
              <nav className="flex items-center justify-center gap-1 pt-6 text-sm">
                <Link
                  href={buildPageLink(previousPage)}
                  aria-disabled={page <= 1}
                  tabIndex={page <= 1 ? -1 : undefined}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 transition-colors ${
                    page <= 1 
                      ? "pointer-events-none opacity-50 bg-gray-50 text-gray-400" 
                      : "bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous</span>
                </Link>

                <div className="flex items-center gap-1 mx-2">
                  {getPageNumbers().map((p, i) => {
                    if (p === "ellipsis") {
                      return (
                        <div key={`ellipsis-${i}`} className="flex h-9 w-9 items-center justify-center text-gray-400">
                          <MoreHorizontal className="h-4 w-4" />
                        </div>
                      )
                    }
                    return (
                      <Link
                        key={p}
                        href={buildPageLink(p)}
                        className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-medium transition-colors ${
                          page === p
                            ? "bg-[#1B4332] text-white pointer-events-none"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        {p}
                      </Link>
                    )
                  })}
                </div>

                <Link
                  href={buildPageLink(nextPage)}
                  aria-disabled={page >= totalPages}
                  tabIndex={page >= totalPages ? -1 : undefined}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 transition-colors ${
                    page >= totalPages
                      ? "pointer-events-none opacity-50 bg-gray-50 text-gray-400"
                      : "bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next</span>
                </Link>
              </nav>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  )
}
