import { createClient, getAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { MessageCircle, Eye, TrendingUp, ArrowUpRight, Search, ArrowLeft, Phone } from "lucide-react"
import { formatNaira } from "@/lib/utils"
import { UNIVERSITIES } from "@/lib/constants"

export const metadata = {
  title: "WhatsApp Analytics | HousePlug Admin",
}

export default async function WhatsAppAnalyticsPage({
  searchParams,
}: {
  searchParams: { sort?: string; order?: string; search?: string }
}) {
  const supabase = createClient()
  const db = getAdminClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    redirect("/")
  }

  // Fetch all listings with their whatsapp_clicks, views, and landlord info
  const { data: listings } = await db
    .from("listings")
    .select(`
      id,
      title,
      area,
      university,
      room_type,
      price_yearly,
      status,
      views_count,
      whatsapp_clicks,
      created_at,
      landlord:profiles!landlord_id(id, full_name, username, avatar_url, verification_status)
    `)
    .order("whatsapp_clicks", { ascending: false })

  const allListings = listings || []

  // Apply search filter
  const searchQuery = searchParams.search?.toLowerCase() || ""
  const filtered = searchQuery
    ? allListings.filter(l =>
        l.title.toLowerCase().includes(searchQuery) ||
        (l.landlord as any)?.full_name?.toLowerCase().includes(searchQuery) ||
        l.area?.toLowerCase().includes(searchQuery)
      )
    : allListings

  // Sort
  const sortKey = searchParams.sort || "whatsapp_clicks"
  const sortOrder = searchParams.order || "desc"
  const sorted = [...filtered].sort((a, b) => {
    let valA: number, valB: number
    switch (sortKey) {
      case "views":
        valA = a.views_count || 0
        valB = b.views_count || 0
        break
      case "conversion":
        valA = a.views_count ? ((a.whatsapp_clicks || 0) / a.views_count) : 0
        valB = b.views_count ? ((b.whatsapp_clicks || 0) / b.views_count) : 0
        break
      case "title":
        return sortOrder === "asc"
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title)
      default:
        valA = a.whatsapp_clicks || 0
        valB = b.whatsapp_clicks || 0
    }
    return sortOrder === "asc" ? valA - valB : valB - valA
  })

  // Aggregate stats
  const totalClicks = allListings.reduce((sum, l) => sum + (l.whatsapp_clicks || 0), 0)
  const totalViews = allListings.reduce((sum, l) => sum + (l.views_count || 0), 0)
  const avgConversion = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0"
  const topListing = allListings[0]

  // Top landlords by aggregated WhatsApp clicks
  const landlordClickMap: Record<string, { name: string; username?: string; avatar?: string; clicks: number; listings: number }> = {}
  allListings.forEach(l => {
    const landlord = l.landlord as any
    if (!landlord) return
    const id = landlord.id
    if (!landlordClickMap[id]) {
      landlordClickMap[id] = {
        name: landlord.full_name || "Unknown",
        username: landlord.username,
        avatar: landlord.avatar_url,
        clicks: 0,
        listings: 0,
      }
    }
    landlordClickMap[id].clicks += l.whatsapp_clicks || 0
    landlordClickMap[id].listings += 1
  })
  const topLandlords = Object.values(landlordClickMap)
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5)

  function buildSortUrl(key: string) {
    const newOrder = sortKey === key && sortOrder === "desc" ? "asc" : "desc"
    const params = new URLSearchParams()
    params.set("sort", key)
    params.set("order", newOrder)
    if (searchQuery) params.set("search", searchQuery)
    return `?${params.toString()}`
  }

  function SortIndicator({ column }: { column: string }) {
    if (sortKey !== column) return null
    return (
      <span className="ml-1 text-[10px]">
        {sortOrder === "desc" ? "↓" : "↑"}
      </span>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to dashboard
          </Link>
          <h1 className="text-3xl font-black text-[#1B4332]">WhatsApp Analytics</h1>
          <p className="text-gray-500 font-medium mt-1">Track WhatsApp contact clicks across all property listings</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total WhatsApp Clicks"
          value={totalClicks.toLocaleString()}
          icon={<MessageCircle className="h-6 w-6" />}
          color="bg-[#25D366]"
          subtitle="All time"
        />
        <StatCard
          title="Total Listing Views"
          value={totalViews.toLocaleString()}
          icon={<Eye className="h-6 w-6" />}
          color="bg-blue-500"
          subtitle="All time"
        />
        <StatCard
          title="Avg. Conversion Rate"
          value={`${avgConversion}%`}
          icon={<TrendingUp className="h-6 w-6" />}
          color="bg-purple-500"
          subtitle="Clicks ÷ Views"
        />
        <StatCard
          title="Top Listing Clicks"
          value={topListing ? String(topListing.whatsapp_clicks || 0) : "0"}
          icon={<ArrowUpRight className="h-6 w-6" />}
          color="bg-amber-500"
          subtitle={topListing?.title ? `${topListing.title.slice(0, 24)}…` : "—"}
        />
      </div>

      {/* Two-column: Top Landlords + Search/Table */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-6">
        {/* Top Landlords Sidebar */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50">
            <h3 className="text-base font-bold text-gray-900">Top Landlords by Clicks</h3>
            <p className="text-xs text-gray-400 mt-0.5">Aggregated across all listings</p>
          </div>
          <div className="divide-y divide-gray-50">
            {topLandlords.length > 0 ? topLandlords.map((landlord, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                <span className="text-sm font-black text-gray-200 w-5">{i + 1}</span>
                {landlord.avatar ? (
                  <img src={landlord.avatar} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#1B4332] text-white flex items-center justify-center text-xs font-bold ring-2 ring-[#1B4332]/10">
                    {landlord.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{landlord.name}</p>
                  <p className="text-[11px] text-gray-400">{landlord.listings} listing{landlord.listings !== 1 ? 's' : ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-[#25D366]">{landlord.clicks}</p>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">clicks</p>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-gray-400 text-sm">No data yet</div>
            )}
          </div>
        </div>

        {/* Main table area */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Search bar */}
          <div className="p-5 border-b border-gray-50">
            <form method="GET" className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="search"
                defaultValue={searchQuery}
                placeholder="Search by title, landlord, or area..."
                className="w-full pl-11 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332]/20 outline-none transition-all"
              />
              {searchParams.sort && <input type="hidden" name="sort" value={searchParams.sort} />}
              {searchParams.order && <input type="hidden" name="order" value={searchParams.order} />}
            </form>
          </div>

          {/* Results count */}
          <div className="px-5 py-3 bg-gray-50/50 border-b border-gray-50 flex items-center justify-between">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {sorted.length} listing{sorted.length !== 1 ? 's' : ''}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">
                    <Link href={buildSortUrl("title")} className="hover:text-gray-700 transition-colors">
                      Property <SortIndicator column="title" />
                    </Link>
                  </th>
                  <th className="px-5 py-4 text-xs font-black text-gray-400 uppercase tracking-wider hidden md:table-cell">
                    Landlord
                  </th>
                  <th className="px-5 py-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center">
                    <Link href={buildSortUrl("views")} className="hover:text-gray-700 transition-colors">
                      Views <SortIndicator column="views" />
                    </Link>
                  </th>
                  <th className="px-5 py-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center">
                    <Link href={buildSortUrl("whatsapp_clicks")} className="hover:text-gray-700 transition-colors">
                      <span className="inline-flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5" /> Clicks <SortIndicator column="whatsapp_clicks" />
                      </span>
                    </Link>
                  </th>
                  <th className="px-5 py-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center hidden sm:table-cell">
                    <Link href={buildSortUrl("conversion")} className="hover:text-gray-700 transition-colors">
                      Conv. <SortIndicator column="conversion" />
                    </Link>
                  </th>
                  <th className="px-5 py-4 text-xs font-black text-gray-400 uppercase tracking-wider text-center hidden lg:table-cell">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.length > 0 ? sorted.map((listing) => {
                  const landlord = listing.landlord as any
                  const university = UNIVERSITIES.find(u => u.id === listing.university)
                  const clicks = listing.whatsapp_clicks || 0
                  const views = listing.views_count || 0
                  const conversion = views > 0 ? ((clicks / views) * 100).toFixed(1) : "0"

                  return (
                    <tr key={listing.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-5 py-4">
                        <Link href={`/admin/listings/${listing.id}/edit`} className="block group-hover:text-[#1B4332] transition-colors">
                          <p className="text-sm font-semibold text-gray-900 truncate max-w-[220px]">{listing.title}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {listing.area} · {university?.shortName || listing.university}
                          </p>
                        </Link>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-2.5">
                          {landlord?.avatar_url ? (
                            <img src={landlord.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[10px] font-bold">
                              {landlord?.full_name?.charAt(0) || "?"}
                            </div>
                          )}
                          <div>
                            <p className="text-sm text-gray-700 truncate max-w-[140px]">{landlord?.full_name || "Unknown"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="text-sm font-semibold text-gray-700">{views.toLocaleString()}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-sm font-black ${clicks > 0 ? 'text-[#25D366]' : 'text-gray-300'}`}>
                          <MessageCircle className="w-3.5 h-3.5" />
                          {clicks.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center hidden sm:table-cell">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                          Number(conversion) >= 10
                            ? 'bg-emerald-50 text-emerald-700'
                            : Number(conversion) >= 5
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-gray-50 text-gray-500'
                        }`}>
                          {conversion}%
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center hidden lg:table-cell">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          listing.status === 'active'
                            ? 'bg-emerald-50 text-emerald-600'
                            : listing.status === 'pending'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {listing.status}
                        </span>
                      </td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
                      <MessageCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-sm font-bold text-gray-400">No listings found</p>
                      <p className="text-xs text-gray-300 mt-1">Try adjusting your search term</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color, subtitle }: {
  title: string
  value: string
  icon: React.ReactNode
  color: string
  subtitle: string
}) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-4">
      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white ${color} shadow-lg`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{title}</p>
        <h3 className="text-3xl font-black text-gray-900 mt-0.5">{value}</h3>
        <p className="text-xs text-gray-400 mt-1 truncate">{subtitle}</p>
      </div>
    </div>
  )
}
