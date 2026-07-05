import { createClient } from "@/lib/supabase/server"
import ReviewTable from "@/components/admin/review-table"
import Link from "next/link"

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const supabase = createClient()

  const currentPage = parseInt(searchParams.page || "1")
  const pageSize = 20

  const { data: reviews, count, error } = await supabase
    .from("reviews")
    .select(`
      *,
      listing:listings(title)
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range((currentPage - 1) * pageSize, currentPage * pageSize - 1)

  if (error) {
    console.error("[ADMIN_REVIEWS] Error fetching reviews:", error)
  }

  const totalPages = Math.ceil((count || 0) / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#1B4332]">Review Management</h1>
      </div>

      <ReviewTable reviews={reviews as any[]} />

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }).map((_, i) => (
            <Link
              key={i}
              href={`/admin/reviews?page=${i + 1}`}
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
