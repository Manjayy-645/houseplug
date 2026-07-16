import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
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
              <nav className="flex items-center justify-center gap-2 py-8" aria-label="Pagination">
                <Link
                  href={buildPageLink(previousPage)}
                  aria-disabled={page <= 1}
                  className={`flex items-center gap-1 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium transition-all ${
                    page <= 1
                      ? "pointer-events-none cursor-not-allowed text-gray-300 opacity-40"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Link>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p =>
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - page) <= 1
                    )
                    .reduce<(number | "...")[]>((acc, p, i, arr) => {
                      if (i > 0 && p - (arr[i - 1] as number) > 1) {
                        acc.push("...")
                      }
                      acc.push(p)
                      return acc
                    }, [])
                    .map((p, i) =>
                      p === "..." ? (
                        <span key={`ellipsis-${i}`} className="px-2 text-gray-400">
                          …
                        </span>
                      ) : (
                        <Link
                          key={p}
                          href={buildPageLink(p as number)}
                          className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-medium transition-all ${
                            page === p
                              ? "bg-[#1B4332] text-white shadow-sm"
                              : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {p}
                        </Link>
                      )
                    )}
                </div>

                <Link
                  href={buildPageLink(nextPage)}
                  aria-disabled={page >= totalPages}
                  className={`flex items-center gap-1 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium transition-all ${
                    page >= totalPages
                      ? "pointer-events-none cursor-not-allowed text-gray-300 opacity-40"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </nav>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  )
}
