"use client"

import Link from "next/link"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

type ListingRowActionsProps = {
  listingId: string
}

export function ListingRowActions({ listingId }: ListingRowActionsProps) {
  const router = useRouter()

  const onDeactivate = async () => {
    const supabase = createClient()
    await supabase.from("listings").update({ status: "inactive" }).eq("id", listingId)
    router.refresh()
  }

  const onDelete = async () => {
    const confirmed = window.confirm("Delete this listing permanently?")
    if (!confirmed) return
    const supabase = createClient()
    await supabase.from("listings").delete().eq("id", listingId)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
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
            onClick={onDeactivate}
            className="block w-full rounded px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100"
          >
            Deactivate
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="block w-full rounded px-2 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </details>
    </div>
  )
}

