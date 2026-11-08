import { createClient, getAdminClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Users, Search, ArrowLeft } from "lucide-react"
import { AdminRoommateTable } from "@/components/admin/admin-roommate-table"

export default async function AdminRoommatesPage({
  searchParams,
}: {
  searchParams: { status?: string; search?: string; page?: string }
}) {
  const db = getAdminClient()

  const currentStatus = searchParams.status || "all"
  const search = searchParams.search || ""
  const currentPage = parseInt(searchParams.page || "1")
  const pageSize = 20

  // Build query — fetch roommate_profiles without FK join
  // (user_id references auth.users, not profiles, so PostgREST can't auto-join)
  let query = db
    .from("roommate_profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((currentPage - 1) * pageSize, currentPage * pageSize - 1)

  if (currentStatus !== "all") {
    query = query.eq("status", currentStatus)
  }

  const { data: roommates, count, error } = await query

  // Handle error early before attempting profile lookup
  if (error) {
    console.error("[ADMIN_ROOMMATES] Error:", error)
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-2xl text-red-700">
        <h2 className="text-lg font-bold">Error loading roommate profiles</h2>
        <p className="text-sm opacity-90">{error.message}</p>
      </div>
    )
  }

  // Fetch associated profiles separately and merge
  let finalRoommates: any[] = roommates || []

  if (roommates && roommates.length > 0) {
    const userIds = roommates.map((r: any) => r.user_id)
    const { data: profilesData } = await db
      .from("profiles")
      .select("id, full_name, email, avatar_url, verification_status")
      .in("id", userIds)

    if (profilesData) {
      const profileMap: Record<string, any> = {}
      profilesData.forEach((p: any) => { profileMap[p.id] = p })
      finalRoommates = roommates.map((r: any) => ({
        ...r,
        profile: profileMap[r.user_id] || null,
      }))
    }
  }

  // Apply client-side search filter (search by name or university)
  if (search) {
    const searchLower = search.toLowerCase()
    finalRoommates = finalRoommates.filter((r: any) => {
      const name = r.profile?.full_name?.toLowerCase() || ""
      const email = r.profile?.email?.toLowerCase() || ""
      const uni = r.university?.toLowerCase() || ""
      return name.includes(searchLower) || email.includes(searchLower) || uni.includes(searchLower)
    })
  }

  // Stats
  const { count: activeCount } = await supabase
    .from("roommate_profiles")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")

  const { count: pausedCount } = await supabase
    .from("roommate_profiles")
    .select("*", { count: "exact", head: true })
    .eq("status", "paused")

  const { count: foundCount } = await supabase
    .from("roommate_profiles")
    .select("*", { count: "exact", head: true })
    .eq("status", "found")


  const totalPages = Math.ceil((count || 0) / pageSize)


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4332]">Roommate Profiles</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage student roommate listings across all universities.
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={count || 0} active={currentStatus === "all"} href="/admin/roommates" />
        <StatCard label="Active" value={activeCount || 0} active={currentStatus === "active"} href="/admin/roommates?status=active" color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Paused" value={pausedCount || 0} active={currentStatus === "paused"} href="/admin/roommates?status=paused" color="text-amber-600" bg="bg-amber-50" />
        <StatCard label="Found" value={foundCount || 0} active={currentStatus === "found"} href="/admin/roommates?status=found" color="text-blue-600" bg="bg-blue-50" />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <form className="flex gap-2 w-full md:w-auto">
          <input type="hidden" name="status" value={currentStatus} />
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search name, email, or university..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4332] outline-none w-full md:w-72"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#1B4332] text-white rounded-lg hover:bg-[#2D5A47] transition-colors"
          >
            <Search className="h-4 w-4" />
          </button>
        </form>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {["all", "active", "paused", "found"].map((status) => (
            <Link
              key={status}
              href={`/admin/roommates?status=${status}&search=${search}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap ${
                currentStatus === status
                  ? "bg-[#1B4332] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {status}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      {finalRoommates.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Users className="h-10 w-10 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No roommate profiles found.</p>
          <Link href="/admin/roommates" className="mt-3 inline-block text-[#1B4332] font-semibold hover:underline text-sm">
            Clear all filters
          </Link>
        </div>
      ) : (
        <AdminRoommateTable roommates={finalRoommates as any[]} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }).map((_, i) => (
            <Link
              key={i}
              href={`/admin/roommates?status=${currentStatus}&search=${search}&page=${i + 1}`}
              className={`px-4 py-2 rounded ${
                currentPage === i + 1
                  ? "bg-[#1B4332] text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {i + 1}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, active, href, color = "text-gray-900", bg = "bg-gray-50" }: {
  label: string
  value: number
  active: boolean
  href: string
  color?: string
  bg?: string
}) {
  return (
    <Link
      href={href}
      className={`p-4 rounded-2xl border transition-all active:scale-95 ${
        active
          ? "border-[#1B4332] bg-[#1B4332]/5 shadow-md"
          : "border-gray-100 bg-white shadow-sm hover:shadow-md"
      }`}
    >
      <p className="text-xs font-black text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-black mt-1 ${active ? "text-[#1B4332]" : color}`}>{value}</p>
    </Link>
  )
}
