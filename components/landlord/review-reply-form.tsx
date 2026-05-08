"use client"

import { useState } from "react"
import { replyToReview } from "@/app/actions"
import { MessageSquare, Send, Loader2 } from "lucide-react"

export function ReviewReplyForm({ reviewId, initialReply }: { reviewId: string, initialReply?: string }) {
  const [reply, setReply] = useState(initialReply || "")
  const [isEditing, setIsEditing] = useState(!initialReply)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reply.trim()) return

    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append("reviewId", reviewId)
    formData.append("reply", reply)

    const result = await replyToReview(formData)

    if (result?.error) {
      setError(result.error)
    } else {
      setIsEditing(false)
    }
    setLoading(false)
  }

  if (!isEditing && initialReply) {
    return (
      <div className="mt-4 rounded-lg bg-emerald-50 p-4 border-l-4 border-[#1B4332]">
        <div className="flex justify-between items-start mb-2">
          <p className="text-xs font-bold text-[#1B4332] uppercase tracking-wider">Your Response</p>
          <button 
            onClick={() => setIsEditing(true)}
            className="text-xs font-semibold text-gray-500 hover:text-[#1B4332]"
          >
            Edit
          </button>
        </div>
        <p className="text-sm text-gray-700 italic">"{initialReply}"</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <div className="relative">
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Write your response to this student..."
          className="w-full rounded-xl border border-gray-300 p-4 pr-12 text-sm outline-none focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/20 resize-none min-h-[100px]"
          required
        />
        <button
          type="submit"
          disabled={loading || !reply.trim()}
          className="absolute bottom-3 right-3 p-2 bg-[#1B4332] text-white rounded-lg hover:bg-[#2D5A47] disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
      {initialReply && (
        <button 
          type="button"
          onClick={() => setIsEditing(false)}
          className="text-xs font-semibold text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      )}
    </form>
  )
}
