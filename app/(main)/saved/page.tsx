import { createClient } from "@/lib/supabase/server"
import { ListingCard } from "@/components/listing-card"
import { redirect } from "next/navigation"
import { HeartOff } from "lucide-react"
import Link from "next/link"
import type { Listing } from "@/types"

export const dynamic = "force-dynamic"

export default async function SavedListingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: savedData, error } = await supabase
    .from("saved_listings")
    .select(`
      listing_id,
      listing:listings (
        *,
        landlord:profiles(full_name, verification_status, role)
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const savedListings = (savedData?.map(item => ({
    ...(item.listing as any),
    is_saved: true
  })) ?? []) as unknown as Listing[]

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl mt-24">
      <div className="mb-8">
        <h1 className="text-3xl font-display-lg text-primary mb-2">Saved Lodges</h1>
        <p className="text-gray-500">Your favorite listings saved for later.</p>
      </div>

      {!savedListings || savedListings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <HeartOff className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No saved lodges yet</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            When you see a lodge you like, tap the heart icon to save it here for quick access later.
          </p>
          <Link 
            href="/browse"
            className="inline-flex items-center justify-center bg-primary text-white rounded-full px-6 py-3 font-semibold hover:bg-primary-dark transition-colors"
          >
            Browse Listings
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {savedListings.map((listing, index) => (
            <ListingCard 
              key={listing.id} 
              listing={listing}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  )
}
