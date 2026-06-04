"use client"

import { useState } from "react"
import Link from "next/link"
import { MoreHorizontal, Pencil, Trash2, Loader2, Eye } from "lucide-react"
import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

type ListingRowActionsProps = {
  listingId: string
  status: string
}

export function ListingRowActions({ listingId, status }: ListingRowActionsProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeactivating, setIsDeactivating] = useState(false)
  const [isActivating, setIsActivating] = useState(false)

  const onDeactivate = async () => {
    if (isDeactivating) return
    setIsDeactivating(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("listings")
        .update({ status: "inactive" })
        .eq("id", listingId)

      if (error) throw error
      router.refresh()
    } catch (error: any) {
      console.error("Error deactivating listing:", error)
      alert(error.message || "Failed to deactivate listing. Please try again.")
    } finally {
      setIsDeactivating(false)
    }
  }

  const onActivate = async () => {
    if (isActivating) return
    setIsActivating(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("listings")
        .update({ status: "active" })
        .eq("id", listingId)

      if (error) throw error
      router.refresh()
    } catch (error: any) {
      console.error("Error activating listing:", error)
      alert(error.message || "Failed to activate listing. Please try again.")
    } finally {
      setIsActivating(false)
    }
  }

  const onDelete = async () => {
    if (isDeleting) return
    const confirmed = window.confirm("Delete this listing permanently?")
    if (!confirmed) return

    setIsDeleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("listings").delete().eq("id", listingId)

      if (error) throw error
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
          {status === "active" || status === "pending" ? (
            <button
              type="button"
              onClick={onDeactivate}
              disabled={isDeactivating}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              {isDeactivating ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Deactivate
            </button>
          ) : (
            <button
              type="button"
              onClick={onActivate}
              disabled={isActivating}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
            >
              {isActivating ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              Reactivate
            </button>
          )}
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

