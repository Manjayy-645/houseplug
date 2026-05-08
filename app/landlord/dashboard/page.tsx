import Link from "next/link"
import { Lock, Star } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { formatNaira } from "@/lib/utils"
import { ListingRowActions } from "@/components/landlord/listing-row-actions"
import type { Listing, Review } from "@/types"

export default async function LandlordDashboardPage({ searchParams }: { searchParams?: { payment?: string } }) {
  const supabase = createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) return null

  const [{ data: listingsData }, { data: subscriptionData }, { data: reviewsData }, { data: profile }] = await Promise.all([
    supabase
      .from("listings")
      .select("*")
      .eq("landlord_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select("*")
      .eq("landlord_id", user.id)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("reviews")
      .select("id, listing_id, student_id, rating, comment, created_at, student:profiles(*), listing:listings!inner(landlord_id)")
      .eq("listing.landlord_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single()
  ])

  const listings = (listingsData ?? []) as Listing[]
  const reviews = ((reviewsData ?? []) as any[]).map((review) => ({
    ...review,
    student: Array.isArray(review.student) ? review.student[0] : review.student
  })) as Review[]

  const firstName = profile?.full_name?.split(" ")[0] ?? "Landlord"

  const now = Date.now()
  const activePlan = (subscriptionData?.active && subscriptionData.expires_at && new Date(subscriptionData.expires_at).getTime() > now)
    ? subscriptionData.plan
    : "free"

  const limits = {
    free: 1,
    pro: 5,
    business: 1000
  }

  const currentLimit = limits[activePlan as keyof typeof limits] || 1
  const isLimitReached = listings.length >= currentLimit
  const nextTier = activePlan === "free" ? "Pro" : activePlan === "pro" ? "Business" : null

  const totalViews = listings.reduce((sum, listing) => sum + (listing.views_count ?? 0), 0)
  const totalClicks = listings.reduce((sum, listing) => sum + (listing.whatsapp_clicks ?? 0), 0)
  const activeListings = listings.filter((l) => l.status === "active").length
  const avgRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0

  const latestReviews = reviews.slice(0, 3)

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {firstName} 👋</h1>
        <p className="mt-1 text-sm text-gray-600">Manage listings, views, and tenant feedback.</p>
      </header>

      {isLimitReached ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">
            {activePlan === "business"
              ? "You've reached your listing limit. Thank you for your partnership!"
              : `You've reached your ${activePlan} plan limit (${currentLimit} ${currentLimit === 1 ? 'listing' : 'listings'}). ${nextTier ? `Upgrade to ${nextTier} to add more.` : ''}`}
          </p>
          {nextTier && (
            <Link href="/landlord/subscription" className="mt-2 inline-block text-sm font-semibold text-[#1B4332]">
              View Plans
            </Link>
          )}
        </div>
      ) : null}

      {searchParams?.payment === 'success' && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-900">
            🎉 Payment successful! Your plan has been upgraded.
          </p>
        </div>
      )}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Views", value: totalViews.toLocaleString("en-NG"), sub: "Across all listings" },
          { label: "WhatsApp Clicks", value: totalClicks.toLocaleString("en-NG"), sub: "Total contacts" },
          { label: "Active Listings", value: String(activeListings), sub: `${listings.length} total listings` },
          { label: "Avg Rating", value: avgRating ? avgRating.toFixed(1) : "0.0", sub: `${reviews.length} reviews` }
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-600">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-[#1B4332]">{stat.value}</p>
            <p className="mt-1 text-xs text-gray-500">{stat.sub}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">My Listings</h2>
          <Link
            href={isLimitReached ? "#" : "/landlord/listings/new"}
            aria-disabled={isLimitReached}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              isLimitReached
                ? "cursor-not-allowed bg-gray-200 text-gray-500"
                : "bg-[#F59E0B] text-gray-900 hover:brightness-95"
            }`}
          >
            + Add New Listing
          </Link>
        </div>

        <div className="space-y-3">
          {listings.map((listing) => (
            <article
              key={listing.id}
              className="flex flex-col gap-3 rounded-lg border border-gray-200 p-3 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-14 w-16 shrink-0 overflow-hidden rounded bg-gray-200">
                  {listing.photos?.[0] ? (
                    <img src={listing.photos[0]} alt={listing.title} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        listing.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : listing.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {listing.status}
                    </span>
                    <p className="truncate text-sm font-semibold text-gray-900">{listing.title}</p>
                    {listing.is_featured ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        ⭐ Featured
                      </span>
                    ) : activePlan === "free" ? (
                      <Link href="/landlord/subscription" className="text-[10px] font-medium text-gray-400 hover:text-[#1B4332] hover:underline">
                        Featured &mdash; Upgrade to Pro
                      </Link>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-gray-600">
                    {listing.area} - {formatNaira(listing.price_yearly)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {listing.views_count ?? 0} views - {listing.whatsapp_clicks ?? 0} contacts
                  </p>
                </div>
              </div>
              <ListingRowActions listingId={listing.id} />
            </article>
          ))}

          {isLimitReached && nextTier ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
              <Lock className="mx-auto h-5 w-5 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600 uppercase tracking-wider font-bold">Upgrade to {nextTier} to unlock more listing slots.</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Reviews</h2>
          <Link href="/landlord/reviews" className="text-sm font-semibold text-[#1B4332]">
            View all
          </Link>
        </div>
        <div className="space-y-3">
          {latestReviews.length === 0 ? (
            <p className="text-sm text-gray-600">No reviews yet.</p>
          ) : (
            latestReviews.map((review) => (
              <div key={review.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">
                    {listings.find((listing) => listing.id === review.listing_id)?.title ?? "Listing"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(review.created_at).toLocaleDateString("en-NG")}
                  </p>
                </div>
                <p className="mt-1 text-xs text-gray-600">{review.student?.full_name ?? "Student"}</p>
                <p className="mt-1 flex items-center gap-1 text-sm text-amber-600">
                  <Star className="h-4 w-4 fill-[#F59E0B]" /> {review.rating.toFixed(1)}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-gray-700">{review.comment}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
