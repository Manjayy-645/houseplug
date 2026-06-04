import Link from "next/link"
import { Lock, Star, ShieldAlert, X, Share2, PartyPopper, Sparkles, Clock, Crown, Phone } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { formatNaira } from "@/lib/utils"
import { ListingRowActions } from "@/components/landlord/listing-row-actions"
import type { Listing, Review } from "@/types"
import { getLandlordSubscription, getListingLimit } from "@/lib/billing"
import { isSubscriptionExpiringSoon, formatExpiryDate, daysUntilExpiry } from "@/lib/billing-utils"

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
  
  // All plans have unlimited listings now.
  const listingLimit = Infinity
  const canAddListing = true
  const expiringSoon = subscription.expires_at
    ? isSubscriptionExpiringSoon(subscription.expires_at)
    : false
  const isTrial = (subscription as any).is_trial === true
  const trialDaysLeft = subscription.expires_at ? daysUntilExpiry(subscription.expires_at) : 0

  const firstName = profile?.full_name?.split(" ")[0] ?? "Landlord"
  const verificationStatus = isAdmin ? "verified" : ((profile as any)?.verification_status || 'unverified')

  const now = Date.now()

  const totalViews = listings.reduce((sum, listing) => sum + (listing.views_count ?? 0), 0)
  const totalClicks = listings.reduce((sum, listing) => sum + (listing.whatsapp_clicks ?? 0), 0)
  const avgRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0

  const latestReviews = reviews.slice(0, 3)

  const planDisplay: Record<string, string> = {
    free: 'Free Plan',
    pro: 'Pro Plan',
    business: 'Business Plan',
  }

  return (
    <div className="space-y-6 p-4 lg:p-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {firstName}</h1>
          <p className="mt-1 text-sm text-gray-600">Manage listings, views, and tenant feedback.</p>
        </div>
        <div className="bg-[#1B4332]/5 border border-[#1B4332]/10 px-4 py-2 rounded-xl flex items-center gap-2">
           <Crown className="h-4 w-4 text-[#1B4332]" />
           <span className="text-xs font-bold text-[#1B4332]">
             {isTrial ? `Pro Trial (${trialDaysLeft} days)` : planDisplay[subscription.plan] || 'Free Plan'}
           </span>
        </div>
      </header>

      {/* PRIORITY BANNERS */}
      <div className="space-y-4">
        {!profile?.phone && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <Phone className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Add your phone number</p>
              <p className="text-xs text-amber-600">
                Students need your WhatsApp number to contact you about listings.
              </p>
            </div>
            <Link
              href="/landlord/profile"
              className="ml-auto bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
            >
              Add Number
            </Link>
          </div>
        )}
        {subscription.expired && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="font-bold text-red-700">
                {isTrial ? "Your Pro trial has ended" : `Your ${subscription.plan} plan has expired`}
              </p>
              <p className="text-sm text-red-600">
                Your listings are still live but no longer featured.
              </p>
            </div>
            <Link href="/landlord/subscription"
               className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap hover:bg-red-700 transition">
              {isTrial ? "Upgrade to Pro" : "Renew Now"}
            </Link>
          </div>
        )}

        {/* Trial: comfortably active */}
        {isTrial && !subscription.expired && trialDaysLeft > 7 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <Sparkles className="h-5 w-5 shrink-0 text-emerald-600" />
            <p className="text-sm text-emerald-800">
              <span className="font-bold">You&apos;re on a 30-day Pro trial — {trialDaysLeft} days left.</span>{" "}
              Enjoy featured listings and full analytics.
            </p>
          </div>
        )}

        {/* Trial: ending soon */}
        {isTrial && !subscription.expired && trialDaysLeft <= 7 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-800">
                <span className="font-bold">Your Pro trial ends in {trialDaysLeft} {trialDaysLeft === 1 ? "day" : "days"}.</span>{" "}
                Subscribe to keep your featured listings and analytics.
              </p>
            </div>
            <Link href="/landlord/subscription"
               className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap hover:bg-amber-700 transition">
              Subscribe Now
            </Link>
          </div>
        )}

        {!subscription.expired && !isTrial && expiringSoon && subscription.expires_at && (
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
            value: `${activeListingsCount} listings`, 
            sub: "No limit on any plan"
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
          <Link
            href="/landlord/listings/new"
            className="rounded-lg bg-[#1B4332] text-white px-4 py-2 text-sm font-bold transition hover:brightness-110"
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
                <Link href={`/listing/${listing.id}`} className="h-14 w-16 shrink-0 overflow-hidden rounded bg-gray-200">
                  {listing.photos?.[0] ? (
                    <img src={listing.photos[0]} alt={listing.title} className="h-full w-full object-cover" />
                  ) : null}
                </Link>
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
                    <Link href={`/listing/${listing.id}`} className="truncate text-sm font-bold text-gray-900 flex-1 min-w-[100px] hover:text-[#1B4332] hover:underline">{listing.title}</Link>
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
