"use client"

import { useState } from "react"
import Link from "next/link"
import { MoreHorizontal, Pencil, Loader2, Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { deleteListing } from "@/app/actions"

type ListingRowActionsProps = {
  listingId: string
  status: string
  landlordId: string
}

export function ListingRowActions({ listingId, status, landlordId }: ListingRowActionsProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [showSuccessFeeModal, setShowSuccessFeeModal] = useState(false)

  const handlePaySuccessFee = async () => {
    if (isToggling) return
    setIsToggling(true)
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "success_fee",
          listing_id: listingId,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to initiate payment")

      if (data.authorization_url) {
        window.location.href = data.authorization_url
      }
    } catch (error: any) {
      console.error("Error initiating payment:", error)
      alert(error.message || "Failed to initiate payment. Please try again.")
      setIsToggling(false)
    }
  }

  const toggleAvailability = async () => {
    // This is only called when making a listing AVAILABLE from UNAVAILABLE.
    // Marking it unavailable is handled via the success fee payment now.
    if (isToggling) return
    const newStatus = "active"
    setIsToggling(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("listings")
        .update({ status: newStatus })
        .eq("id", listingId)
        .eq("landlord_id", landlordId) // security: only the owner can toggle

      if (error) throw error
      router.refresh()
    } catch (error: any) {
      console.error("Error updating availability:", error)
      alert(error.message || "Failed to update listing. Please try again.")
    } finally {
      setIsToggling(false)
    }
  }

  const onDelete = async () => {
    if (isDeleting) return
    const confirmed = window.confirm("Delete this listing permanently?")
    if (!confirmed) return

    setIsDeleting(true)
    try {
      // Server action removes stored photos + video before dropping the row.
      const result = await deleteListing(listingId)
      if (result?.error) throw new Error(result.error)
      router.refresh()
    } catch (error: any) {
      console.error("Error deleting listing:", error)
      alert(error.message || "Failed to delete listing. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {/* Availability toggle — only meaningful for live/hidden listings */}
      {status === "active" && (
        <>
          <button
            type="button"
            onClick={() => setShowSuccessFeeModal(true)}
            disabled={isToggling}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-50"
          >
            {isToggling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <EyeOff className="h-3.5 w-3.5" />}
            Mark Unavailable
          </button>

          {showSuccessFeeModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
              <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl relative">
                <h3 className="mb-2 text-lg font-bold text-gray-900">Property Rented?</h3>
                <p className="mb-6 text-sm text-gray-600">
                  Please pay ₦1000 to mark this listing as rented. Your contribution helps keep HousePlug running!
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSuccessFeeModal(false)}
                    disabled={isToggling}
                    className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handlePaySuccessFee}
                    disabled={isToggling}
                    className="flex-1 rounded-xl bg-[#1B4332] px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110 transition flex items-center justify-center"
                  >
                    {isToggling ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pay with Paystack"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      {status === "unavailable" && (
        <button
          type="button"
          onClick={toggleAvailability}
          disabled={isToggling}
          className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-all disabled:opacity-50"
        >
          {isToggling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
          Mark Available
        </button>
      )}

      <Link
        href={`/listing/${listingId}`}
        className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        aria-label="View listing"
      >
        <Eye className="h-4 w-4" />
      </Link>
      <Link
        href={`/landlord/listings/${listingId}/edit`}
        className="rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        aria-label="Edit listing"
      >
        <Pencil className="h-4 w-4" />
      </Link>
      <details className="relative">
        <summary className="list-none rounded-md p-2 text-gray-600 hover:cursor-pointer hover:bg-gray-100 hover:text-gray-900">
          <MoreHorizontal className="h-4 w-4" />
        </summary>
        <div className="absolute right-0 z-10 mt-1 w-40 rounded-md border border-gray-200 bg-white p-1 shadow-lg">
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Delete
          </button>
        </div>
      </details>
    </div>
  )
}
