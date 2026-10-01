"use client"

import { useState } from "react"
import { Listing, Profile } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { formatDate } from "@/lib/utils"
import { Eye, Check, X, Loader2, Home, ShieldCheck, Pin, PinOff, Trash2, Pencil, Play, Phone } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface ListingWithLandlord extends Listing {
  landlord: Profile
}

export default function ListingTable({ listings }: { listings: ListingWithLandlord[] }) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [rejectingListing, setRejectingListing] = useState<ListingWithLandlord | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [presetReason, setPresetReason] = useState("")

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to PERMANENTLY delete "${title}"? This cannot be undone.`)) return

    setLoading(id)
    try {
      const res = await fetch('/api/admin/listings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: id, action: 'delete' })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      router.refresh()
    } catch (error: any) {
      alert(error.message || "Failed to delete listing")
    }
    setLoading(null)
  }

  const handleApprove = async (id: string) => {
    setLoading(id)
    try {
      const res = await fetch('/api/admin/listings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: id, action: 'approve' })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      router.refresh()
    } catch (error: any) {
      alert(error.message || "Failed to approve listing")
    }
    setLoading(null)
  }

  const handleToggleHome = async (id: string, currentValue: boolean) => {
    setLoading(id)
    try {
      const res = await fetch('/api/admin/listings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: id, action: 'toggle_home', show_on_home: !currentValue })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      router.refresh()
    } catch (error: any) {
      console.error("Error toggling home page status:", error)
      alert(`Failed to update home page status: ${error.message}`)
    }
    setLoading(null)
  }

  const handleReject = async () => {
    if (!rejectingListing || !presetReason) return
    const finalReason = presetReason === "Other" ? rejectionReason : (rejectionReason ? `${presetReason} - ${rejectionReason}` : presetReason)
    if (!finalReason.trim()) return

    setLoading(rejectingListing.id)
    try {
      const res = await fetch('/api/admin/listings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: rejectingListing.id, action: 'reject', reason: finalReason })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      setRejectingListing(null)
      setRejectionReason("")
      setPresetReason("")
      router.refresh()
    } catch (error: any) {
      alert(error.message || "Failed to reject listing")
    }
    setLoading(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>
      case "pending":
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>
      case "rejected":
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Rejected</span>
      case "unavailable":
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">Unavailable</span>
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600">
              <th className="px-6 py-4">Listing</th>
              <th className="px-6 py-4">Landlord</th>
              <th className="px-6 py-4">Submitted</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {listings?.map((listing) => (
              <tr key={listing.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                      {listing.photos?.[0] ? (
                        <img
                          src={listing.photos[0]}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-room.jpg'
                          }}
                        />
                      ) : listing.video_url ? (
                        <div className="relative w-full h-full bg-gray-900">
                          <video
                            src={listing.video_url}
                            preload="metadata"
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Play className="w-5 h-5 text-white fill-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Home className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 truncate max-w-[200px]">{listing.title}</div>
                      <div className="text-xs text-gray-500 capitalize">{listing.room_type.replace("_", " ")} • ₦{listing.price_yearly.toLocaleString()}/yr</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="text-gray-900 font-medium">{listing.landlord?.full_name}</div>
                    {listing.landlord?.verification_status === 'verified' && (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                        <span className="sr-only">Verified Landlord</span>
                      </>
                    )}
                  </div>
                  <div className="text-gray-500">{listing.landlord?.phone || listing.whatsapp_number || "No phone"}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {formatDate(listing.created_at)}
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(listing.status)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/listing/${listing.id}`}
                      target="_blank"
                      className="p-2 text-gray-500 hover:text-[#1B4332] hover:bg-gray-100 rounded-lg transition-colors"
                      title="View Listing"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                    <Link
                      href={`/admin/listings/${listing.id}/edit`}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Listing"
                    >
                      <Pencil className="w-5 h-5" />
                    </Link>
                    {(listing.landlord?.phone || listing.whatsapp_number) && (
                      <a
                        href={`https://wa.me/${(listing.landlord?.phone || listing.whatsapp_number)?.replace(/\D/g, "").replace(/^0/, "234")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Contact Landlord on WhatsApp"
                      >
                        <Phone className="w-5 h-5" />
                      </a>
                    )}
                    {listing.status === "active" && (
                      <button
                        onClick={() => handleToggleHome(listing.id, !!listing.show_on_home)}
                        disabled={loading === listing.id}
                        className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                          listing.show_on_home 
                            ? "text-amber-600 bg-amber-50 hover:bg-amber-100" 
                            : "text-gray-400 hover:text-amber-600 hover:bg-gray-100"
                        }`}
                        title={listing.show_on_home ? "Remove from Home Page" : "Show on Home Page"}
                      >
                        {loading === listing.id ? <Loader2 className="w-5 h-5 animate-spin" /> : listing.show_on_home ? <Pin className="w-5 h-5 fill-current" /> : <PinOff className="w-5 h-5" />}
                      </button>
                    )}
                    {listing.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleApprove(listing.id)}
                          disabled={loading === listing.id}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Approve Listing"
                        >
                          {loading === listing.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => setRejectingListing(listing)}
                          disabled={loading === listing.id}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Reject Listing"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(listing.id, listing.title)}
                      disabled={loading === listing.id}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete Listing Permanently"
                    >
                      {loading === listing.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Reject Modal */}
      {rejectingListing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reject Listing</h3>
            <p className="text-sm text-gray-500 mb-4">
              Please provide a reason for rejecting <span className="font-semibold text-gray-700">{rejectingListing.title}</span>. This will be shown to the landlord.
            </p>
            
            <div className="space-y-4">
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4332] outline-none text-sm"
                value={presetReason}
                onChange={(e) => setPresetReason(e.target.value)}
              >
                <option value="">Select a reason</option>
                <option value="Photos are unclear or missing">Photos are unclear or missing</option>
                <option value="Price not specified">Price not specified</option>
                <option value="Location/address is incomplete">Location/address is incomplete</option>
                <option value="Property details are insufficient">Property details are insufficient</option>
                <option value="Listing appears to be a duplicate">Listing appears to be a duplicate</option>
                <option value="Suspicious or fraudulent listing">Suspicious or fraudulent listing</option>
                <option value="Other">Other (specify below)</option>
              </select>

              {(presetReason === "Other" || presetReason !== "") && (
                <textarea
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4332] outline-none resize-none text-sm"
                  placeholder={presetReason === "Other" ? "Specify reason..." : "Additional details (optional)..."}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setRejectingListing(null)
                  setRejectionReason("")
                  setPresetReason("")
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={(!presetReason || (presetReason === "Other" && !rejectionReason.trim())) || loading === rejectingListing.id}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading === rejectingListing.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Rejecting...
                  </>
                ) : (
                  "Confirm Rejection"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
