import Link from "next/link"
import { Lock, Star, ShieldAlert, X, Share2, PartyPopper, Sparkles, Clock, Crown, Phone, Eye, User, ShieldCheck, CheckCircle2, AlertCircle, BarChart3, Building2, MousePointerClick, ArrowRight } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { formatNaira } from "@/lib/utils"
import { ListingRowActions } from "@/components/landlord/listing-row-actions"
import { ListingAppealActions } from "@/components/landlord/listing-appeal-actions"
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
  const pendingListings = listings.filter((l) => l.status === "pending")
  const unavailableListings = listings.filter((l) => l.status === "unavailable" || l.status === "rejected")
  const activeListingsCount = activeListings.length
  
  const effectivePlan = subscription.expired ? 'free' : subscription.plan
  const listingLimit = isAdmin ? Infinity : await getListingLimit(effectivePlan)
  const canAddListing = activeListingsCount < listingLimit
  const expiringSoon = subscription.expires_at
    ? isSubscriptionExpiringSoon(subscription.expires_at)
    : false
  const isTrial = (subscription as any).is_trial === true
  const trialDaysLeft = subscription.expires_at ? daysUntilExpiry(subscription.expires_at) : 0

  const firstName = profile?.full_name?.split(" ")[0] ?? "Partner"
  const verificationStatus = isAdmin ? "verified" : ((profile as any)?.verification_status || 'unverified')

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
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#1B4332] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              {profile?.role === "agent" ? "Verified Agent" : "Landlord Console"}
            </span>
            {verificationStatus === "verified" && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#10B981]">
                <ShieldCheck className="h-3.5 w-3.5" /> ID Verified
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">Welcome back, {firstName}</h1>
          <p className="mt-0.5 text-xs text-gray-500">Manage your student properties, track views, and update availability.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="bg-emerald-50/80 border border-emerald-100 px-3.5 py-2 rounded-xl flex items-center gap-2">
             <Crown className="h-4 w-4 text-[#1B4332]" />
             <span className="text-xs font-extrabold text-[#1B4332]">
               {isTrial ? `Pro Trial (${trialDaysLeft}d)` : planDisplay[subscription.plan] || 'Free Plan'}
             </span>
          </div>
          {canAddListing ? (
            <Link
              href="/landlord/listings/new"
              className="inline-flex items-center gap-1.5 bg-[#1B4332] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#153427] active:scale-95 transition shadow-2xs"
            >
              <span>+ Add Property</span>
            </Link>
          ) : null}
        </div>
      </header>

      {/* PRIORITY ALERTS */}
      <div className="space-y-3">
        {!profile?.phone && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-xs sm:text-sm font-bold text-amber-900">Add your WhatsApp contact number</p>
                <p className="text-[11px] text-amber-700">
                  Students need your active WhatsApp number to contact you about listings.
                </p>
              </div>
            </div>
            <Link
              href="/landlord/profile"
              className="bg-amber-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap hover:bg-amber-600 transition shrink-0"
            >
              Add Number
            </Link>
          </div>
        )}

        {subscription.expired && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
            <div>
              <p className="font-bold text-red-800 text-xs sm:text-sm">
                {isTrial ? "Your Pro trial has ended" : `Your ${subscription.plan} plan has expired`}
              </p>
              <p className="text-[11px] text-red-600">
                Your listings remain live but no longer receive featured search placement.
              </p>
            </div>
            <Link href="/landlord/subscription"
               className="bg-red-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap hover:bg-red-700 transition shrink-0">
              {isTrial ? "Upgrade to Pro" : "Renew Plan"}
            </Link>
          </div>
        )}

        {verificationStatus === 'unverified' && !subscription.expired && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
               <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
               <div>
                  <p className="font-bold text-amber-900 text-xs sm:text-sm">Account Verification Recommended</p>
                  <p className="text-[11px] text-amber-700">
                    Students prioritize verified landlords and agents. Submit ID to earn the Verified badge.
                  </p>
               </div>
            </div>
            <Link href="/landlord/verification"
               className="bg-[#1B4332] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap hover:bg-[#153427] transition shrink-0">
              Get Verified
            </Link>
          </div>
        )}

        {searchParams?.payment === 'success' && (
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 shadow-2xs">
            <p className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-900">
              <PartyPopper className="h-4 w-4 text-[#10B981]" /> Payment confirmed! Your plan and featured benefits are now active.
            </p>
          </div>
        )}
      </div>

      {/* CORE PERFORMANCE METRICS */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Active Listings */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Active Listings</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-[#1B4332]">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#1B4332]">{activeListingsCount}</p>
          <p className="text-[11px] text-gray-500 mt-1">
            {listingLimit === Infinity ? "Unlimited allowance" : `${activeListingsCount} of ${listingLimit} allowed`}
          </p>
        </div>

        {/* Metric 2: Property Views */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Property Views</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <Eye className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">{totalViews.toLocaleString("en-NG")}</p>
          <p className="text-[11px] text-gray-500 mt-1">Total student page visits</p>
        </div>

        {/* Metric 3: WhatsApp Contact Clicks */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">WhatsApp Clicks</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <MousePointerClick className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700">{totalClicks.toLocaleString("en-NG")}</p>
          <p className="text-[11px] text-gray-500 mt-1">Direct student lead clicks</p>
        </div>

        {/* Metric 4: Availability & Reviews */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Listing Status</span>
            <div className="p-2 rounded-xl bg-amber-50 text-[#F59E0B]">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">
            {activeListingsCount} <span className="text-xs font-normal text-gray-500">Live</span>
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            {pendingListings.length > 0 ? `${pendingListings.length} pending review · ` : ""}
            {unavailableListings.length} paused
          </p>
        </div>
      </section>

      {/* WhatsApp Lead Disclaimer */}
      <div className="rounded-xl bg-gray-50 p-3 text-[11px] text-gray-500 border border-gray-100 flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-[#F59E0B] shrink-0" />
        <span>
          <strong>Product Model Note:</strong> WhatsApp clicks represent direct student connections. They are prospective student leads rather than completed rental agreements or completed physical inspections.
        </span>
      </div>

      {/* Shareable Landlord Profile Card */}
      {activeListingsCount > 0 && profile?.username && (
        <div className="bg-white border border-emerald-100 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div>
            <p className="inline-flex items-center gap-2 text-sm text-[#1B4332] font-extrabold">
              <Share2 className="h-4 w-4 text-[#F59E0B]" />
              <span>Your Public Accommodation Portfolio</span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Share your digital business card with students on WhatsApp: <span className="font-mono text-[#1B4332] font-semibold">houseplug.ng/card/{profile.username}</span>
            </p>
          </div>
          <Link 
            href="/landlord/profile" 
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 text-[#1B4332] text-xs font-bold hover:bg-emerald-100 transition shrink-0"
          >
            <span>View Public Card</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* MY PROPERTIES / LISTINGS MANAGEMENT */}
      <section id="listings" className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base sm:text-lg font-black text-gray-900">My Properties</h2>
            <p className="text-xs text-gray-500">Edit information, toggle availability, or request boosts.</p>
          </div>
          {canAddListing ? (
            <Link
              href="/landlord/listings/new"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1B4332] text-white px-4 py-2 text-xs font-bold transition hover:bg-[#153427] active:scale-95 shadow-2xs"
            >
              <span>+ Add New Listing</span>
            </Link>
          ) : (
            <button
              disabled
              className="rounded-xl bg-gray-200 text-gray-500 px-4 py-2 text-xs font-bold cursor-not-allowed"
              title={`You have reached your limit of ${listingLimit} active listings.`}
            >
              + Add Listing (Limit Reached)
            </button>
          )}
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-12 rounded-xl bg-gray-50/60 border border-dashed border-gray-200">
            <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-700">No properties listed yet</p>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
              Add your student rooms and lodges near UniPort, RSU, IAUE, or KenPoly to start receiving WhatsApp leads.
            </p>
            <Link
              href="/landlord/listings/new"
              className="inline-flex items-center gap-2 bg-[#1B4332] text-white px-4 py-2 rounded-xl text-xs font-bold hover:brightness-110 transition"
            >
              <span>Post Your First Property</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((listing) => (
              <article
                key={listing.id}
                className={`flex flex-col gap-3 rounded-xl border p-3.5 sm:p-4 transition-all md:flex-row md:items-center md:justify-between ${
                  listing.status === "unavailable" 
                    ? "bg-gray-50/70 border-gray-200 opacity-80" 
                    : "bg-white border-gray-100 hover:border-gray-200 shadow-2xs"
                }`}
              >
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <Link href={`/listing/${listing.id}`} className="h-16 w-18 shrink-0 overflow-hidden rounded-xl bg-gray-100 relative">
                      {listing.photos?.[0] ? (
                        <img src={listing.photos[0]} alt={listing.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-300">
                          <Building2 className="h-6 w-6" />
                        </div>
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                            listing.status === "active"
                              ? "bg-emerald-100 text-emerald-800"
                              : listing.status === "pending"
                                ? "bg-amber-100 text-amber-900"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {listing.status}
                        </span>
                        <Link 
                          href={`/listing/${listing.id}`} 
                          className="truncate text-sm font-bold text-gray-900 hover:text-[#1B4332] hover:underline"
                        >
                          {listing.title}
                        </Link>
                        {listing.is_featured ? (
                          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-900 uppercase">
                            <Star className="h-3 w-3 fill-current" /> Featured
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-gray-600">
                        {listing.area} · <strong className="text-[#1B4332]">{formatNaira(listing.price_yearly)}</strong>/yr
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {listing.views_count ?? 0} views · {listing.whatsapp_clicks ?? 0} WhatsApp clicks
                      </p>
                    </div>
                  </div>
                  
                  {listing.status === "rejected" && (
                    <div className="mt-2">
                      <ListingAppealActions listingId={listing.id} rejectionReason={listing.rejection_reason} />
                    </div>
                  )}
                </div>
                <div className="shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                  <ListingRowActions listingId={listing.id} status={listing.status} landlordId={user.id} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* RECENT REVIEWS */}
      <section className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div>
            <h2 className="text-base font-black text-gray-900">Student Reviews</h2>
            <p className="text-xs text-gray-500">Feedback left by students who inspected or rented your rooms.</p>
          </div>
          <Link href="/landlord/reviews" className="text-xs font-bold text-[#1B4332] hover:underline">
            View all ({reviews.length})
          </Link>
        </div>
        <div className="space-y-3">
          {latestReviews.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-4">No student reviews received yet.</p>
          ) : (
            latestReviews.map((review) => (
              <div key={review.id} className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-gray-900 truncate">
                    {listings.find((listing) => listing.id === review.listing_id)?.title ?? "Listing"}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {new Date(review.created_at).toLocaleDateString("en-NG")}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[#F59E0B] font-bold my-1">
                  <Star className="h-3.5 w-3.5 fill-[#F59E0B]" />
                  <span>{review.rating.toFixed(1)}</span>
                  <span className="text-gray-400 font-normal ml-2">by {review.reviewer_name ?? "Student"}</span>
                </div>
                <p className="text-gray-700 line-clamp-2 text-[11px]">{review.review_text}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
