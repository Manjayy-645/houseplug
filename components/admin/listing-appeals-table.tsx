"use client"

import { useState } from "react"
import { Check, X, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ListingAppealsTable({ appeals }: { appeals: any[] }) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  const handleAction = async (appealId: string, action: "approve" | "reject") => {
    if (!confirm(`Are you sure you want to ${action} this listing appeal?`)) return
    
    setLoading(appealId)
    try {
      const res = await fetch("/api/admin/listing-appeals/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appealId, action }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      router.refresh()
    } catch (err: any) {
      alert(err.message || `Failed to ${action} appeal`)
    } finally {
      setLoading(null)
    }
  }

  if (!appeals || appeals.length === 0) {
    return (
      <div className="p-6 text-center bg-gray-50 rounded-2xl border border-gray-100 mt-4">
        <p className="text-gray-500 font-medium">No pending listing appeals.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 mt-4">
      {appeals.map(appeal => (
        <div key={appeal.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="flex-1">
              <h4 className="font-bold text-gray-900">{appeal.listing?.title || "Unknown Listing"}</h4>
              <p className="text-xs text-gray-500">Address: {appeal.listing?.address}</p>
              <p className="text-xs text-gray-500 mt-1">
                Landlord: {appeal.landlord?.full_name} ({appeal.landlord?.email})
              </p>
              
              <div className="mt-3">
                <p className="text-xs font-bold text-indigo-600 uppercase">Appeal Type: {appeal.appeal_type}</p>
                <p className="text-sm text-gray-700 bg-indigo-50 p-2 rounded-lg mt-1 border border-indigo-100 whitespace-pre-wrap">
                  {appeal.appeal_message || "No message provided."}
                </p>
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => handleAction(appeal.id, "reject")}
                disabled={loading === appeal.id}
                className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-semibold transition flex items-center gap-1 disabled:opacity-50"
              >
                {loading === appeal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                Reject
              </button>
              <button
                onClick={() => handleAction(appeal.id, "approve")}
                disabled={loading === appeal.id}
                className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-semibold transition flex items-center gap-1 disabled:opacity-50"
              >
                {loading === appeal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Approve
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
