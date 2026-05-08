import { createClient } from "@/lib/supabase/server"
import { ListingCard } from "@/components/listing-card"
import type { Listing, Review } from "@/types"

type SimilarListingsProps = {
  currentListingId: string
  roomType: string
}

export default async function SimilarListings({
  currentListingId,
  roomType
}: SimilarListingsProps) {
  const supabase = createClient()

  const { data: listingsData } = await supabase
    .from("listings")
    .select("*, landlord:profiles(*)")
    .eq("status", "active")
    .eq("room_type", roomType)
    .neq("id", currentListingId)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(3)

  const listings = (listingsData ?? []) as Listing[]
  if (!listings.length) return null

  const ids = listings.map((l) => l.id)
  const { data: reviewsData } = await supabase
    .from("reviews")
    .select("id, listing_id, student_id, rating, comment, created_at")
    .in("listing_id", ids)

  const reviews = (reviewsData ?? []) as Review[]
  const byListingId = new Map<string, Review[]>()
  for (const review of reviews) {
    const list = byListingId.get(review.listing_id) ?? []
    list.push(review)
    byListingId.set(review.listing_id, list)
  }

  const enriched = listings.map((l) => ({
    ...l,
    reviews: byListingId.get(l.id) ?? []
  }))

  return (
    <section className="space-y-4">
      <h3 className="text-base font-semibold text-gray-900">Other rooms near UniPort</h3>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {enriched.map((listing) => (
          <div key={listing.id} className="w-[320px] shrink-0">
            <ListingCard listing={listing} />
          </div>
        ))}
      </div>
    </section>
  )
}

