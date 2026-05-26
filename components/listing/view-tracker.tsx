"use client"

import { useEffect } from "react"
import { recordListingView } from "@/app/actions"

export default function ViewTracker({ listingId }: { listingId: string }) {
  useEffect(() => {
    // We wrap it in a small delay to avoid double counts in dev mode/Strict Mode if needed,
    // though recordListingView handles it on the server.
    recordListingView(listingId)
  }, [listingId])

  return null
}
