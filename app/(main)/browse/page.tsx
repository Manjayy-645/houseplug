import Link from "next/link"
import type { Metadata } from "next"
import { ChevronLeft, ChevronRight, Users } from "lucide-react"
import { FilterSidebar } from "@/components/filter-sidebar"
import { ListingCard } from "@/components/listing-card"
import { SearchBar } from "@/components/search-bar"
import { createClient } from "@/lib/supabase/server"
import { UNIVERSITIES } from "@/lib/constants"
import { formatRoomType } from "@/lib/utils"
import { BreadcrumbJsonLd } from "@/components/seo/json-ld"
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

export async function generateMetadata({ searchParams }: BrowsePageProps): Promise<Metadata> {
  const university = searchParams.university?.trim()
  const q = searchParams.q?.trim()
  const roomType = searchParams.room_type?.trim()

  const matchedUni = UNIVERSITIES.find(
    (u) =>
      u.id.toLowerCase() === university?.toLowerCase() ||
      u.shortName.toLowerCase() === university?.toLowerCase()
  )

  let title = "Student Accommodation in Port Harcourt"
  let description =
    "Search student lodges, self-cons and apartments near UniPort, RSU, IAUE and KenPoly. Compare details and contact listing agents directly on WhatsApp."

  if (matchedUni && roomType) {
    const formattedType = formatRoomType(roomType as any)
    title = `${formattedType} near ${matchedUni.shortName} (${matchedUni.area})`
    description = `Find ${formattedType.toLowerCase()} accommodation near ${matchedUni.name} in ${matchedUni.area}. Contact listing agents directly on WhatsApp.`
  } else if (matchedUni) {
    title = `Student Housing near ${matchedUni.shortName} (${matchedUni.area})`
    description = `Browse off-campus student accommodation, self-cons and lodges near ${matchedUni.name} in ${matchedUni.area}. Direct WhatsApp contact with agents.`
  } else if (q) {
    title = `"${q}" — Student Lodges & Accommodation`
    description = `Search results for "${q}" on HousePlug. Student accommodation near Port Harcourt universities.`
  } else if (roomType) {
    const formattedType = formatRoomType(roomType as any)
    title = `${formattedType} Student Housing in Port Harcourt`
    description = `Browse ${formattedType.toLowerCase()} student accommodation near universities in Port Harcourt on HousePlug.`
  }

  const queryParams = new URLSearchParams()
  if (university) queryParams.set("university", university)
  if (roomType) queryParams.set("room_type", roomType)
  const queryString = queryParams.toString()
  const canonicalUrl = queryString
    ? `https://www.houseplug.ng/browse?${queryString}`
    : "https://www.houseplug.ng/browse"

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} | HousePlug`,
      description,
      url: canonicalUrl,
      siteName: "HousePlug",
      locale: "en_NG",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | HousePlug`,
      description,
    },
  }
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const supabase = createClient()

  const q = searchParams.q?.trim()
  const university = searchParams.university?.trim()
  const roomTypeStr = searchParams.room_type?.trim()
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
    // Split the query into individual words and require ALL words to match somewhere
    // This makes the search order-independent and much more robust.
    const terms = q.trim().split(/\s+/).filter(Boolean)
    terms.forEach(term => {
      // Remove characters that might break PostgREST syntax (commas, quotes, parentheses, backslashes)
      const safeTerm = term.replace(/[,'\"()\\\\]/g, '')
      if (safeTerm) {
        query = query.or(`address.ilike.%${safeTerm}%,area.ilike.%${safeTerm}%,landmark.ilike.%${safeTerm}%,title.ilike.%${safeTerm}%`)
      }
    })
  }
  if (university) query = query.eq("university", university)
  if (roomTypeStr) {
    const types = roomTypeStr.split(',').filter(Boolean)
    if (types.length > 0) {
      query = query.in("room_type", types)
    }
  }
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
  let listings = (data ?? []) as unknown as Listing[]
  const total = count ?? 0

  // Fetch saved listings for the logged in user
  const { data: { user } } = await supabase.auth.getUser()
  if (user && listings.length > 0) {
    const listingIds = listings.map(l => l.id)
    const { data: savedData } = await supabase
      .from("saved_listings")
      .select("listing_id")
      .eq("user_id", user.id)
      .in("listing_id", listingIds)
    
    if (savedData && savedData.length > 0) {
      const savedSet = new Set(savedData.map(s => s.listing_id))
      listings = listings.map(l => ({
        ...l,
        is_saved: savedSet.has(l.id)
      }))
    }
  }
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

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Browse Housing", url: "/browse" },
  ]
  if (university) {
    const uniObj = UNIVERSITIES.find(u => u.id === university)
    if (uniObj) {
      breadcrumbItems.push({ name: uniObj.shortName, url: `/browse?university=${uniObj.id}` })
    }
  }

  return (
    <main className="min-h-screen bg-[#F9FAFB] px-4 py-8 pt-24 lg:px-6 lg:pt-28">
      <BreadcrumbJsonLd items={breadcrumbItems} />
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
            {/* Roommate Promo Banner on Browse Page */}
            <div className="bg-gradient-to-r from-emerald-50 to-amber-50 border border-emerald-100/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="bg-white p-3 rounded-xl shadow-sm text-[#F59E0B]">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base">Need someone to split the rent?</h3>
                  <p className="text-gray-500 text-xs sm:text-sm">Find verified roommates from your university.</p>
                </div>
              </div>
              <Link 
                href="/roommates" 
                className="bg-[#1B4332] text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-md hover:bg-emerald-900 transition-colors w-full sm:w-auto text-center shrink-0"
              >
                Find Roommates
              </Link>
            </div>

            <div className="flex flex-col gap-2 px-1">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                {selectedUniversity 
                  ? `Rooms near ${selectedUniversity.shortName}` 
                  : "All Student Rooms across Nigeria"}
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
                {listings.map((listing, index) => (
                  <ListingCard key={listing.id} listing={listing} index={index} />
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
