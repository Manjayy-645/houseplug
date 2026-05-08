import { Star, X } from "lucide-react"
import type { Review } from "@/types"
import type { Profile } from "@/types"
import { getInitials } from "@/lib/utils"

type ReviewsSectionProps = {
  reviews: Review[]
  averageRating: number
}

function shortName(profile?: Profile) {
  const full = profile?.full_name?.trim() ?? ""
  const parts = full.split(" ").filter(Boolean)
  if (!parts.length) return "Student"
  const first = parts[0]
  const secondInitial = parts[1]?.[0]
  if (!secondInitial) return `${first}.`
  return `${first} ${secondInitial}.`
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
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Student Reviews</h3>
          <p className="mt-1 text-sm text-gray-600">What tenants say about this place</p>
        </div>
        <div className="text-right">
          <Stars value={averageRating || 0} />
          <p className="mt-1 text-xs text-gray-500">{reviewCount} review(s)</p>
        </div>
      </div>

      <div className="space-y-2">
        {[
          "Location",
          "Value",
          "Cleanliness",
          "Landlord"
        ].map((label) => (
          <div key={label} className="flex items-center gap-3">
            <span className="w-24 text-sm text-gray-700">{label}</span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100">
              <div className="h-full bg-[#1B4332]" style={{ width: `${percent}%` }} />
            </div>
          </div>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-center">
          <p className="text-sm font-medium text-gray-800">No reviews yet. Be the first to review after your stay.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {shown.map((review) => (
              <div key={review.id} className="rounded-xl border border-gray-100 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1B4332] text-sm font-semibold text-white">
                      {getInitials(review.student?.full_name ?? "Tenant")}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{shortName(review.student)}</p>
                      <p className="text-xs text-gray-500">{formatReviewDate(review.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          className={`h-4 w-4 ${
                            idx < review.rating ? "fill-[#F59E0B] text-[#F59E0B]" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-700">{review.comment}</p>
                
                {review.reply && (
                  <div className="mt-4 rounded-lg bg-emerald-50/50 p-3 border-l-2 border-[#1B4332]">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#1B4332]" />
                      <p className="text-xs font-bold text-[#1B4332] uppercase tracking-wider">Landlord&apos;s Response</p>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed italic">
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
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              Show all {reviewCount} reviews
            </button>
          ) : null}
        </>
      )}
    </section>
  )
}

