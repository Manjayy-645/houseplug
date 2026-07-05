"use client"

import { useState } from "react"
import { AlertCircle, Edit3, Send, X, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function ListingAppealActions({ listingId, rejectionReason }: { listingId: string, rejectionReason?: string }) {
  const [showDisputeForm, setShowDisputeForm] = useState(false)
  const [disputeMessage, setDisputeMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDispute = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!disputeMessage.trim()) return

    setLoading(true)
    try {
      const res = await fetch("/api/landlord/listings/appeal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, appealType: "dispute", appealMessage: disputeMessage }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      setShowDisputeForm(false)
      setDisputeMessage("")
      router.refresh()
    } catch (err: any) {
      alert(err.message || "Failed to submit dispute")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full mt-3 bg-red-50 border border-red-200 rounded-xl p-4">
      <div className="flex gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
        <div className="flex-1">
          <p className="font-bold text-red-900 text-sm">Listing Rejected</p>
          <p className="text-sm text-red-700 mt-1">{rejectionReason || "No specific reason provided."}</p>
          
          {!showDisputeForm ? (
            <div className="flex flex-wrap gap-2 mt-4">
              <Link
                href={`/landlord/listings/${listingId}/edit`}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition flex items-center gap-1.5"
              >
                <Edit3 className="w-4 h-4" /> Edit & Resubmit
              </Link>
              <button
                onClick={() => setShowDisputeForm(true)}
                className="bg-white text-red-700 border border-red-200 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-50 transition flex items-center gap-1.5"
              >
                Dispute Rejection
              </button>
            </div>
          ) : (
            <form onSubmit={handleDispute} className="mt-4 space-y-3 bg-white p-4 rounded-lg border border-red-100 shadow-sm">
              <p className="text-sm font-semibold text-gray-900">Why do you think this rejection is wrong?</p>
              <textarea
                value={disputeMessage}
                onChange={(e) => setDisputeMessage(e.target.value)}
                required
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm resize-none"
                placeholder="Explain why your listing should be approved..."
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowDisputeForm(false)}
                  className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !disputeMessage.trim()}
                  className="bg-red-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Submit Dispute
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
