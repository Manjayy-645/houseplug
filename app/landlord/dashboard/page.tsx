import Link from "next/link"
import { Lock, Star, ShieldAlert, X, Share2, PartyPopper } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { formatNaira } from "@/lib/utils"
import { ListingRowActions } from "@/components/landlord/listing-row-actions"
import type { Listing, Review } from "@/types"
import { getLandlordSubscription, getListingLimit } from "@/lib/billing"
import { isSubscriptionExpiringSoon, formatExpiryDate } from "@/lib/billing-utils"

export default async function LandlordDashboardPage({ searchParams }: { searchParams?: { payment?: string } }) {
  const supabase = createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) return null

  const [
    { data: listingsData }, 
    subscription, 
    { data: profile }, 
    { data: reviewsData }
  ] = await Promise.all([
    supabase
      .from("listings")
      .select("*")
      .eq("landlord_id", user.id)
      .order("created_at", { ascending: false }),
    getLandlordSubscription(user.id),
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single(),
    supabase
      .from("reviews")
      .select("id, listing_id, student_id, rating, comment, created_at, student:profiles(*), listing:listings!inner(landlord_id)")
      .eq("listing.landlord_id", user.id)
      .order("created_at", { ascending: false })
  ])

  const listings = (listingsData ?? []) as Listing[]
  const reviews = ((reviewsData ?? []) as any[]).map((review) => ({
    ...review,
    student: Array.isArray(review.student) ? review.student[0] : review.student
  })) as Review[]

  const isAdmin = profile?.role === "admin"
  const activeListings = listings.filter((l) => l.status === "active")
  const activeListingsCount = activeListings.length
  
  // Admins get unlimited listings. Expired plans fall back to free limit.
  const effectivePlan = subscription.expired ? 'free' : subscription.plan
  const listingLimit = isAdmin ? Infinity : await getListingLimit(effectivePlan)
  const canAddListing = activeListingsCount < listingLimit
  const expiringSoon = subscription.expires_at 
    ? isSubscriptionExpiringSoon(subscription.expires_at) 
    : false

  const firstName = profile?.full_name?.split(" ")[0] ?? "Landlord"
  const verificationStatus = isAdmin ? "verified" : ((profile as any)?.verification_status || 'unverified')

  const now = Date.now()

  const totalViews = listings.reduce((sum, listing) => sum + (listing.views_count ?? 0), 0)
  const totalClicks = listings.reduce((sum, listing) => sum + (listing.whatsapp_clicks ?? 0), 0)
  const avgRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0

  const latestReviews = reviews.slice(0, 3)

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {firstName}</h1>
        <p className="mt-1 text-sm text-gray-600">Manage listings, views, and tenant feedback.</p>
      </header>

      {/* PRIORITY BANNERS */}
      <div className="space-y-4">
        {subscription.expired && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="font-bold text-red-700">Your {subscription.plan} plan has expired</p>
              <p className="text-sm text-red-600">
                Your listings are still visible but no longer featured. 
                You cannot add new listings until you upgrade.
              </p>
            </div>
            <Link href="/landlord/subscription" 
               className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap hover:bg-red-700 transition">
              Renew Now
            </Link>
          </div>
        )}

        {!subscription.expired && expiringSoon && subscription.expires_at && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="font-bold text-amber-700">
                Your {subscription.plan} plan expires on {formatExpiryDate(subscription.expires_at)}
              </p>
              <p className="text-sm text-amber-600">
                Renew now to avoid losing your featured placement.
              </p>
            </div>
            <Link href="/landlord/subscription"
               className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap hover:bg-amber-700 transition">
              Renew Now
            </Link>
          </div>
        )}

        {subscription.plan === 'free' && !subscription.expired && activeListingsCount >= listingLimit && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="font-bold text-amber-700">Free plan limit reached</p>
              <p className="text-sm text-amber-600">
                You have used your 1 free listing slot. 
                Upgrade to Pro to add up to 5 listings.
              </p>
            </div>
            <Link href="/landlord/subscription"
               className="bg-[#F59E0B] text-white px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap hover:brightness-105 transition">
              Upgrade to Pro
            </Link>
          </div>
        )}

        {verificationStatus === 'unverified' && !subscription.expired && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
               <ShieldAlert className="h-5 w-5 text-yellow-600" />
               <div>
                  <p className="font-bold text-yellow-700">Your account is not verified</p>
                  <p className="text-sm text-yellow-600">
                    Verified landlords get more student inquiries. Get the verified badge on all your listings.
                  </p>
               </div>
            </div>
            <Link href="/landlord/verification"
               className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap hover:bg-yellow-600 transition">
              Get Verified
            </Link>
          </div>
        )}

        {searchParams?.payment === 'success' && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-900">
              <PartyPopper className="h-4 w-4" /> Payment successful! Your plan has been upgraded.
            </p>
          </div>
        )}
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Views", value: totalViews.toLocaleString("en-NG"), sub: "Across all listings" },
          { label: "WhatsApp Clicks", value: totalClicks.toLocaleString("en-NG"), sub: "Total contacts" },
          { 
            label: "Active Listings", 
            value: `${activeListingsCount} / ${listingLimit === Infinity ? '∞' : listingLimit}`, 
            sub: subscription.expired ? "Plan expired — renew to add more" :
                 activeListingsCount >= listingLimit ? "Limit reached — upgrade to add more" : 
                 listingLimit === Infinity ? "Unlimited listings available" :
                 `${listingLimit - activeListingsCount} slots remaining`
          },
          { label: "Avg Rating", value: avgRating ? avgRating.toFixed(1) : "0.0", sub: `${reviews.length} reviews` }
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-600">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-[#1B4332]">{stat.value}</p>
            <p className="mt-1 text-xs text-gray-500">{stat.sub}</p>
          </div>
        ))}
      </section>

      {activeListingsCount > 0 && profile?.username && (
        <div className="bg-white border border-amber-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="inline-flex items-center gap-2 text-sm text-gray-600 font-bold"><Share2 className="h-4 w-4" /> Share your listings</p>
            <p className="text-xs text-[#1B4332] font-medium mt-0.5">houseplug.ng/card/{profile.username}</p>
          </div>
          <Link href="/landlord/profile" className="text-amber-600 font-bold text-sm hover:text-amber-700 transition">
            Share Card &rarr;
          </Link>
        </div>
      )}

      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">My Listings</h2>
          <div className="relative group">
            <Link
              href={!canAddListing ? "#" : "/landlord/listings/new"}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                !canAddListing
                  ? "cursor-not-allowed bg-gray-200 text-gray-400"
                  : "bg-[#1B4332] text-white hover:brightness-110"
              }`}
            >
              + Add New Listing
            </Link>
            {!canAddListing && (
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-48 rounded-lg bg-gray-900 p-2 text-[10px] font-bold text-white text-center">
                {subscription.expired 
                  ? "Renew your plan to add more listings"
                  : subscription.plan === 'free'
                  ? "Upgrade to Pro to add more listings"
                  : "You've reached your plan limit"}
              </div>
            )}
          </div>
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
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        listing.status === "active"
                          ? "bg-emerald-100 text-emerald-700"
                          : listing.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {listing.status}
                    </span>
                    <p className="truncate text-sm font-bold text-gray-900 flex-1 min-w-[100px]">{listing.title}</p>
                    {listing.is_featured ? (
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-800 uppercase tracking-tight">
                        <Star className="h-3 w-3 fill-current" /> Featured
                      </span>
                    ) : (subscription.plan !== "free" && !subscription.expired) ? (
                      <span className="shrink-0 text-[10px] font-bold text-gray-400 uppercase tracking-tight">Standard Placement</span>
                    ) : subscription.plan === "free" ? (
                      <Link href="/landlord/subscription" className="shrink-0 text-[10px] font-bold text-gray-400 hover:text-[#1B4332] hover:underline uppercase tracking-tight">
                        Featured &mdash; Upgrade
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
              <ListingRowActions listingId={listing.id} status={listing.status} />
            </article>
          ))}

          {!canAddListing && (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
              <Lock className="mx-auto h-5 w-5 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600 uppercase tracking-wider font-bold">
                {subscription.expired ? "Renew your plan" : "Upgrade your plan"} to unlock more listing slots.
              </p>
            </div>
          )}
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
