"use client"

import { useState } from "react"
import { Star, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

type ReviewFormProps = {
  listingId: string
  prefillName?: string
}

export default function ReviewForm({ listingId, prefillName }: ReviewFormProps) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [reviewText, setReviewText] = useState("")
  const [reviewerName, setReviewerName] = useState(prefillName || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      setError("Please select a rating.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          rating,
          reviewText,
          reviewerName: reviewerName.trim() || "UniPort Student",
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review")
      }

      setSuccess(true)
      setReviewText("")
      setRating(0)
      router.refresh() // optimistic update
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-xl bg-[#1B7A4D]/20 p-4 text-center border border-[#1B7A4D]/30 mt-6">
        <p className="text-sm font-semibold text-white">Review submitted! Thank you for your feedback.</p>
        <button 
          onClick={() => setSuccess(false)}
          className="mt-2 text-xs font-bold text-[#E8A317] hover:underline"
        >
          Submit another review
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-gray-700 bg-[#0F1F17] p-5 shadow-sm mt-6 text-white">
      <div>
        <h3 className="text-base font-semibold text-white">Leave a Review</h3>
        <p className="mt-1 text-sm text-gray-400">Share your experience to help other students.</p>
      </div>

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-1 focus:outline-none transition-transform active:scale-90"
          >
            <Star
              className={`h-7 w-7 ${
                star <= (hover || rating) ? "fill-[#E8A317] text-[#E8A317]" : "text-gray-600"
              }`}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm font-bold text-gray-300">{rating}.0</span>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1" htmlFor="name">Your Name (optional)</label>
          <input
            id="name"
            type="text"
            value={reviewerName}
            onChange={(e) => setReviewerName(e.target.value)}
            placeholder="e.g. John Doe (Defaults to UniPort Student)"
            className="w-full rounded-xl border border-gray-700 bg-[#0A140F] p-3 text-sm outline-none focus:border-[#1B7A4D] focus:ring-1 focus:ring-[#1B7A4D] text-white placeholder-gray-500"
          />
        </div>
        
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1" htmlFor="review">Written Review (optional)</label>
          <textarea
            id="review"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="What was it like living here? Mention water, light, security..."
            maxLength={500}
            className="w-full h-24 rounded-xl border border-gray-700 bg-[#0A140F] p-3 text-sm outline-none focus:border-[#1B7A4D] focus:ring-1 focus:ring-[#1B7A4D] resize-none text-white placeholder-gray-500"
          />
        </div>
      </div>

      {error && <p className="text-xs font-medium text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-[#1B7A4D] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#15603c] disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Leave a Review"
        )}
      </button>
    </form>
  )
}
