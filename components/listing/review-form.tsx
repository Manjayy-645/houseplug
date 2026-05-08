"use client"

import { useState } from "react"
import { Star, Loader2 } from "lucide-react"
import { submitReview } from "@/app/actions"

type ReviewFormProps = {
  listingId: string
}

export default function ReviewForm({ listingId }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState("")
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

    const formData = new FormData()
    formData.append("listingId", listingId)
    formData.append("rating", rating.toString())
    formData.append("comment", comment)

    const result = await submitReview(formData)

    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setComment("")
      setRating(0)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="rounded-xl bg-emerald-50 p-4 text-center border border-emerald-100">
        <p className="text-sm font-semibold text-emerald-800">Review submitted! Thank you for your feedback.</p>
        <button 
          onClick={() => setSuccess(false)}
          className="mt-2 text-xs font-bold text-emerald-700 hover:underline"
        >
          Submit another review
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm mt-6">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Leave a Review</h3>
        <p className="mt-1 text-sm text-gray-600">Share your experience to help other students.</p>
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
                star <= (hover || rating) ? "fill-[#F59E0B] text-[#F59E0B]" : "text-gray-300"
              }`}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm font-bold text-gray-700">{rating}.0</span>
        )}
      </div>

      <div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What was it like living here? Mention water, light, security..."
          required
          maxLength={500}
          className="w-full h-32 rounded-xl border border-gray-300 p-3 text-sm outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/20 resize-none"
        />
        <div className="mt-1 flex justify-between px-1">
          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
            {comment.length} / 500 characters
          </p>
          {comment.length < 20 && comment.length > 0 && (
            <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">
              Too short
            </p>
          )}
        </div>
      </div>

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-[#1B4332] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#2D5A47] disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Review"
        )}
      </button>
    </form>
  )
}
