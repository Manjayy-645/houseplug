"use client"

import { useState } from "react"
import { Review, Profile } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { formatDate } from "@/lib/utils"
import { Trash2, Star, Loader2, User } from "lucide-react"
import { useRouter } from "next/navigation"

interface ReviewWithDetails extends Review {
  listing: { title: string }
}

export default function ReviewTable({ reviews }: { reviews: ReviewWithDetails[] }) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) return

    setLoading(id)
    try {
      const res = await fetch('/api/admin/reviews/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: id, action: 'delete' })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      router.refresh()
    } catch (error: any) {
      alert(error.message || "Failed to delete review")
    }
    setLoading(null)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600">
              <th className="px-6 py-4">Reviewer</th>
              <th className="px-6 py-4">Listing</th>
              <th className="px-6 py-4">Rating</th>
              <th className="px-6 py-4">Review</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {reviews?.map((review) => (
              <tr key={review.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <User className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900">{review.reviewer_name || "UniPort Student"}</div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-[150px]">
                  {review.listing?.title}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-gray-700">{review.rating}</span>
                    <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 italic max-w-xs">
                  <p className="truncate">"{review.review_text || ""}"</p>
                  {review.reply && (
                    <p className="text-[10px] text-[#1B4332] font-bold mt-1 uppercase tracking-tighter truncate">
                      Reply: {review.reply}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {formatDate(review.created_at)}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDelete(review.id)}
                    disabled={loading === review.id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading === review.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
