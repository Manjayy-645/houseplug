import { Star } from "lucide-react"
import type { Review } from "@/types"
import { getInitials } from "@/lib/utils"

type ReviewsSectionProps = {
  reviews: Review[]
  averageRating: number
}

function formatReviewDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString("en-US", { month: "long", year: "numeric" })
}

function Stars({ value }: { value: number }) {
  const rounded = Math.round(value * 2) / 2
  const filled = Math.round(rounded)

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, idx) => {
        const isFilled = idx < filled
        return (
          <Star
            key={idx}
            className={`h-4 w-4 ${isFilled ? "fill-[#F59E0B] text-[#F59E0B]" : "text-gray-300"}`}
          />
        )
      })}
      <span className="text-sm font-semibold text-gray-800">{rounded.toFixed(1)}</span>
    </div>
  )
}

export default function ReviewsSection({ reviews, averageRating }: ReviewsSectionProps) {
  const safeReviews = reviews ?? []
  const shown = safeReviews.slice(0, 5)
  const reviewCount = safeReviews.length

  const percent = Math.max(0, Math.min(100, (averageRating / 5) * 100))

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-[#0F1F17] p-5 shadow-sm text-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-white">Student Reviews</h3>
          <p className="mt-1 text-sm text-gray-300">What tenants say about this place</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 bg-[#1B7A4D]/20 px-3 py-1.5 rounded-full border border-[#1B7A4D]/30">
            <Star className="h-4 w-4 fill-[#E8A317] text-[#E8A317]" />
            <span className="text-sm font-bold text-white">{averageRating ? averageRating.toFixed(1) : "0.0"}</span>
            <span className="text-xs text-gray-300 ml-1">({reviewCount} review{reviewCount !== 1 ? 's' : ''})</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        {[
          "Location",
          "Value",
          "Cleanliness",
          "Landlord"
        ].map((label) => (
          <div key={label} className="flex items-center gap-3">
            <span className="w-24 text-sm text-gray-300">{label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-800">
              <div className="h-full bg-[#1B7A4D]" style={{ width: `${percent}%` }} />
            </div>
          </div>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-700 bg-[#0A140F] p-5 text-center">
          <p className="text-sm font-medium text-gray-300">Be the first to review this listing 👇</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {shown.map((review) => (
              <div key={review.id} className="rounded-xl border border-gray-800 bg-[#0A140F] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1B7A4D] text-xs font-semibold text-white">
                      {getInitials(review.reviewer_name ?? "UniPort Student")}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{review.reviewer_name ?? "UniPort Student"}</p>
                      <p className="text-xs text-gray-400">{formatReviewDate(review.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          className={`h-4 w-4 ${
                            idx < review.rating ? "fill-[#E8A317] text-[#E8A317]" : "text-gray-700"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                {review.review_text && (
                  <p className="mt-3 text-sm text-gray-300">{review.review_text}</p>
                )}
                
                {review.reply && (
                  <div className="mt-4 rounded-lg bg-[#1B7A4D]/10 p-3 border-l-2 border-[#1B7A4D]">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#1B7A4D]" />
                      <p className="text-xs font-bold text-[#1B7A4D] uppercase tracking-wider">Landlord&apos;s Response</p>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed italic">
                      &quot;{review.reply}&quot;
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {reviewCount > shown.length ? (
            <button
              type="button"
              className="w-full mt-4 rounded-xl border border-gray-700 bg-[#12241A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1A3325] transition"
            >
              Show all {reviewCount} reviews
            </button>
          ) : null}
        </>
      )}
    </section>
  )
}

