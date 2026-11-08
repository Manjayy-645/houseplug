import { createClient, getAdminClient } from "@/lib/supabase/server"
import { Listing, ListingStatus } from "@/types"
import ListingTable from "@/components/admin/listing-table"
import ListingAppealsTable from "@/components/admin/listing-appeals-table"
import Link from "next/link"

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: { status?: ListingStatus | "appeals"; page?: string }
}) {
  const db = getAdminClient()

  const currentStatus = searchParams.status || "all"
  const currentPage = parseInt(searchParams.page || "1")
  const pageSize = 20

  const tabs = [
    { label: "Pending", value: "pending" },
    { label: "Active", value: "active" },
    { label: "Rejected", value: "rejected" },
    { label: "Unavailable", value: "unavailable" },
    { label: "Appeals", value: "appeals" },
    { label: "All", value: "all" },
  ]

  let listings: any[] = []
  let appeals: any[] = []
  let count = 0

  if (currentStatus === "appeals") {
    const { data: appealsData, count: appealsCount } = await db
      .from("listing_appeals")
      .select(`
        *,
        listing:listings(title, address),
        landlord:profiles(full_name, email)
      `, { count: "exact" })
      .eq('status', 'pending')
      .order("created_at", { ascending: false })
      .range((currentPage - 1) * pageSize, currentPage * pageSize - 1)
      
    appeals = appealsData || []
    count = appealsCount || 0
  } else {
    let query = db
      .from("listings")
      .select(`
        *,
        landlord:profiles(*)
      `, { count: "exact" })
      .order("created_at", { ascending: false })
      .range((currentPage - 1) * pageSize, currentPage * pageSize - 1)

    if (currentStatus !== "all") {
      query = query.eq("status", currentStatus)
    }

    const { data, count: listingsCount } = await query
    listings = data || []
    count = listingsCount || 0
  }

  const totalPages = Math.ceil((count || 0) / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#1B4332]">Listing Management</h1>
      </div>

      <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={`/admin/listings?status=${tab.value}`}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              currentStatus === tab.value
                ? "border-[#1B4332] text-[#1B4332]"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {currentStatus === "appeals" ? (
        <ListingAppealsTable appeals={appeals} />
      ) : (
        <ListingTable listings={listings} />
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }).map((_, i) => (
            <Link
              key={i}
              href={`/admin/listings?status=${currentStatus}&page=${i + 1}`}
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
