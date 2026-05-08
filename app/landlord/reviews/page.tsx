import { createClient } from "@/lib/supabase/server"
import { Star, User } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { ReviewReplyForm } from "@/components/landlord/review-reply-form"

export default async function LandlordReviewsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: listings } = await supabase
    .from("listings")
    .select("id")
    .eq("landlord_id", user?.id)

  const listingIds = listings?.map((l) => l.id) ?? []

  const { data: reviews } = listingIds.length > 0 
    ? await supabase
        .from("reviews")
        .select("*, student:profiles(*), listing:listings(title)")
        .in("listing_id", listingIds)
        .order("created_at", { ascending: false })
    : { data: [] }

  return (
    <div className="p-6 lg:p-10">
      <h1 className="text-2xl font-bold text-gray-900">Student Reviews</h1>
      <p className="mt-1 text-sm text-gray-500">See what students are saying about your rooms.</p>

      <div className="mt-8 space-y-4">
        {reviews && reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{review.student?.full_name || "Anonymous Student"}</p>
                    <p className="text-xs text-gray-500">{formatDate(review.created_at)}</p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} 
                    />
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#1B4332]">Listing: {review.listing?.title}</p>
                <p className="mt-2 text-sm text-gray-700 leading-relaxed italic">"{review.comment}"</p>
              </div>

              <ReviewReplyForm reviewId={review.id} initialReply={review.reply} />
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-20 text-center">
            <Star className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No reviews yet</h3>
            <p className="mt-2 text-gray-500 text-sm">Reviews will appear here once students start rating your rooms.</p>
          </div>
        )}
      </div>
    </div>
  )
}
