import Link from "next/link"
import { Star, Flame, Users, Info, Check, EyeOff } from "lucide-react"
import { notFound } from "next/navigation"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import type { Listing, Review } from "@/types"
import { formatDistance, formatNaira, formatRoomType } from "@/lib/utils"
import { UNIVERSITIES } from "@/lib/constants"
import PhotoGallery from "@/components/listing/photo-gallery"
import ContactCard from "@/components/listing/contact-card"
import AmenitiesGrid from "@/components/listing/amenities-grid"
import { ListingDetailsGrid } from "@/components/listing/details-grid"
import LandlordCard from "@/components/listing/landlord-card"
import ReviewsSection from "@/components/listing/reviews-section"
import ReviewForm from "@/components/listing/review-form"
import SimilarListings from "@/components/listing/similar-listings"
import ViewTracker from "@/components/listing/view-tracker"
import SaveButton from "@/components/listing/save-button"
import ShareButton from "@/components/listing/share-button"
import { ListingJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld"
import type { Metadata } from "next"

type ListingDetailPageProps = {
  params: { id: string }
}

export const revalidate = 60 // revalidate every 60 seconds

export async function generateMetadata({ params }: ListingDetailPageProps): Promise<Metadata> {
  const supabase = createClient()
  const listingId = params.id

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(listingId)
  
  if (!isUuid) return {}

  const { data: listing } = await supabase
    .from("listings")
    .select("id, title, price_yearly, room_type, area, university, video_url, photos")
    .eq("id", listingId)
    .single()

  if (!listing) return {}

  const roomTypeStr = formatRoomType(listing.room_type)
  const formattedPriceRaw = new Intl.NumberFormat("en-NG").format(listing.price_yearly)
  const campus = UNIVERSITIES.find(u => u.id === listing.university)?.shortName || listing.university

  const title = `${roomTypeStr} in ${listing.area} — ₦${formattedPriceRaw}/year | HousePlug`
  const description = `Verified student housing near ${campus}. Contact the landlord directly on WhatsApp.`

  const { getWhatsAppListingOgImage } = await import("@/lib/cloudinary")
  
  let isVideo = false
  let mediaUrl = null
  
  if (listing.video_url) {
    isVideo = true
    mediaUrl = listing.video_url
  } else if (listing.photos && listing.photos.length > 0) {
    mediaUrl = listing.photos[0]
  }
  
  const ogImageUrl = getWhatsAppListingOgImage(mediaUrl, isVideo)
  const ogTitle = `${listing.title} — ₦${formattedPriceRaw}/yr`
  const ogDescription = `Verified lodge in ${listing.area}, ${campus} on HousePlug.`
  const listingUrl = `https://houseplug.ng/listing/${listing.id}`

  const metadata: Metadata = {
    title,
    description,
    alternates: {
      canonical: listingUrl,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: listingUrl,
      siteName: "HousePlug",
      locale: "en_NG",
      type: "website",
      images: [
        {
          url: ogImageUrl,
          secureUrl: ogImageUrl,
          width: 1200,
          height: 630,
          type: "image/jpeg",
          alt: listing.title,
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: `Verified lodge in ${listing.area}, ${campus}.`,
      images: [ogImageUrl],
    }
  }

  return metadata
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const supabase = createClient()
  const listingId = params.id

  // Safely fetch listing data, handling potential UUID format errors
  let listingRow = null
  let reviewsRows = null
  let authData = null

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(listingId)
    
    const isGuest = !(await supabase.auth.getUser().catch(() => ({ data: { user: null } }))).data.user

    const results = await Promise.all([
      supabase.auth.getUser().catch(() => ({ data: { user: null } })),
      isUuid 
        ? (isGuest ? createServiceClient() : supabase)
            .from("listings")
            .select(isGuest 
              ? `*, landlord:profiles!landlord_id(id, full_name, avatar_url, verification_status, role, username, created_at)`
              : `*, landlord:profiles!landlord_id(id, full_name, phone, avatar_url, verification_status, role, username, created_at)`
            )
            .eq("id", listingId)
            .single()
        : Promise.resolve({ data: null }),
      isUuid
        ? supabase
            .from("reviews")
            .select("id, rating, review_text, created_at, reviewer_name")
            .eq("listing_id", listingId)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: null })
    ])
    
    authData = (results[0] as any)?.data || { user: null }
    listingRow = (results[1] as any)?.data
    reviewsRows = (results[2] as any)?.data
  } catch (error) {
    console.error("Error fetching listing details:", error)
  }

  const user = authData?.user
  
  let listingRowData = listingRow
  let landlordRowData = null
  let reviews = []

  // Fallback for placeholder IDs if not found in DB
  if (!listingRowData && ["1", "2", "3"].includes(listingId)) {
    const placeholders: Record<string, any> = {
      "1": {
        id: "1",
        landlord_id: "placeholder-landlord",
        title: "Green Court Annex",
        description: "Beautiful self-contained apartment close to campus. Features constant water supply and a serene environment perfect for students.",
        room_type: "self_con",
        price_yearly: 85000,
        distance_from_gate: "under_5",
        address: "Green Court Street, Choba",
        area: "Choba",
        landmark: "Near Choba Market",
        amenities: ["Water", "Security", "Electricity"],
        photos: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=800"],
        status: "active",
        is_featured: true,
        views_count: 120,
        whatsapp_number: "2348000000000"
      },
      "2": {
        id: "2",
        landlord_id: "placeholder-landlord",
        title: "Aluu Scholar Lodge",
        description: "Spacious one-bedroom flat with modern finishing. Ideal for students who value privacy and comfort.",
        room_type: "one_bedroom",
        price_yearly: 120000,
        distance_from_gate: "5_to_15",
        address: "Scholar Way, Aluu",
        area: "Aluu",
        landmark: "Near University Main Gate",
        amenities: ["Water", "Security", "Parking"],
        photos: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=800"],
        status: "active",
        is_featured: true,
        views_count: 85,
        whatsapp_number: "2348000000001"
      },
      "3": {
        id: "3",
        landlord_id: "placeholder-landlord",
        title: "Abuja Campus Suites",
        description: "Shared room in a quiet and secure environment. Perfect for students looking for an affordable and convenient place to stay.",
        room_type: "shared",
        price_yearly: 60000,
        distance_from_gate: "under_5",
        address: "Abuja Campus Road, Abuja",
        area: "Abuja",
        landmark: "Inside Abuja Campus",
        amenities: ["Water", "Electricity"],
        photos: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=800"],
        status: "active",
        is_featured: true,
        views_count: 210,
        whatsapp_number: "2348000000002"
      }
    }
    listingRowData = placeholders[listingId]
    landlordRowData = {
      id: "placeholder-landlord",
      full_name: "Verified Landlord",
      phone: "08000000000",
      avatar_url: null,
      created_at: new Date().toISOString()
    }
  }

  // Fetch real landlord profile and user profile if needed if not already set by fallback
  const [{ data: dbLandlordRow }, { data: userProfile }, { data: existingReview }] = await Promise.all([
    !landlordRowData && listingRowData && !listingRowData.landlord
      ? (!user ? createServiceClient() : supabase).from("profiles").select(!user ? "id, full_name, avatar_url, role, username, created_at" : "id, full_name, phone, avatar_url, role, username, created_at").eq("id", listingRowData.landlord_id).single()
      : Promise.resolve({ data: null }),
    user 
      ? supabase.from("profiles").select("id, role, full_name").eq("id", user.id).single() 
      : Promise.resolve({ data: null }),
    user
      ? supabase.from("reviews").select("id").eq("listing_id", listingId).eq("student_id", user.id).maybeSingle()
      : Promise.resolve({ data: null })
  ])

  const isAdmin = userProfile?.role === "admin" || userProfile?.role === "super_admin"
  const isOwner = user && listingRowData && user.id === listingRowData.landlord_id
  const canView = listingRowData?.status === "active" || isAdmin || isOwner

  if (!listingRowData || !canView) notFound()

  landlordRowData = landlordRowData || dbLandlordRow || (listingRowData as any)?.landlord
  
  reviews = (reviewsRows ?? []) as Review[]

  const reviewCount = reviews.length
  const averageRating =
    reviewCount > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : 0

  // Increment views if it's a real listing and not viewed by owner/admin
  if (listingRow && !isOwner && !isAdmin) {
    void supabase.rpc("increment_views", { listing_id: listingId })
  }

  let isSaved = false
  if (user && listingId) {
    const { data: savedData } = await supabase
      .from("saved_listings")
      .select("id")
      .eq("user_id", user.id)
      .eq("listing_id", listingId)
      .single()
    if (savedData) {
      isSaved = true
    }
  }

  const listing: Listing = {
    ...(listingRowData as Listing),
    landlord: landlordRowData as unknown as any,
    reviews,
    photos: (listingRowData as any).photos ?? [],
    amenities: (listingRowData as any).amenities ?? []
  }

  const campusName = UNIVERSITIES.find(u => u.id === listing.university)?.shortName || listing.university
  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Browse", url: "/browse" },
    { name: campusName, url: `/browse?university=${listing.university}` },
    { name: listing.title, url: `/listing/${listing.id}` },
  ]

  return (
    <main className="min-h-screen bg-[#F9FAFB] pt-20 pb-24 lg:pt-24 lg:pb-12">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <ListingJsonLd
        id={listing.id}
        title={listing.title}
        description={listing.description}
        priceYearly={listing.price_yearly}
        roomType={formatRoomType(listing.room_type)}
        address={listing.address}
        area={listing.area}
        university={campusName}
        photos={listing.photos}
        amenities={listing.amenities}
        createdAt={listing.created_at}
      />
      <ViewTracker listingId={listing.id} />
      {listing.status === "unavailable" && (isOwner || isAdmin) && (
        <div className="bg-gray-800 text-white px-4 py-3 text-center text-sm font-medium flex items-center justify-center gap-2">
          <EyeOff className="w-4 h-4" />
          This listing is marked as unavailable and hidden from students.
        </div>
      )}
      {listing.status !== "active" && listing.status !== "unavailable" && (
        <div className="bg-[#1B4332] text-white px-4 py-3 text-center text-sm font-bold flex items-center justify-center gap-2">
          <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          PREVIEW MODE: This listing is {listing.status} and only visible to you.
        </div>
      )}
      <div className="mx-auto max-w-7xl space-y-4 sm:space-y-6">
        <header className="bg-white px-4 py-6 shadow-sm sm:rounded-2xl sm:mt-4 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 border border-emerald-100">
                  {formatRoomType(listing.room_type)}
                </span>
                {listing.is_featured && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 border border-amber-100">
                    <Star className="h-3 w-3 fill-current" /> Featured
                  </span>
                )}
                {listing.is_urgent && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-red-600 border border-red-100">
                    <Flame className="h-3 w-3" /> Urgent
                  </span>
                )}
                {(listing.landlord?.role === "agent" ||
                  (listing.agent_fee_type && listing.agent_fee_type !== "none")) && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 border border-blue-100">
                    <Users className="h-3 w-3" /> Agent Listed
                  </span>
                )}
              </div>
              <div className="flex items-start gap-4">
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl flex-1">
                  {listing.title}
                </h1>
                <div className="flex items-center gap-2 shrink-0">
                  <ShareButton 
                    title={listing.title}
                    className="bg-gray-50 border border-gray-100 p-2.5 rounded-full hover:bg-gray-100" 
                    iconClassName="w-5 h-5 text-gray-500"
                  />
                  <SaveButton 
                    listingId={listing.id} 
                    initialSaved={isSaved} 
                    className="bg-gray-50 border border-gray-100 p-2.5 rounded-full hover:bg-gray-100" 
                    iconClassName="w-5 h-5"
                  />
                </div>
              </div>
              {reviewCount > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <Star className="h-5 w-5 fill-[#E8A317] text-[#E8A317]" />
                  <span className="text-lg font-bold text-gray-900">{averageRating.toFixed(1)}</span>
                  <span className="text-sm font-medium text-gray-500">· {reviewCount} review{reviewCount !== 1 ? 's' : ''}</span>
                </div>
              )}
              <p className="flex items-center gap-1.5 text-sm font-medium text-gray-500 mt-2">
                <span className="text-[#1B4332]">{listing.area}</span>
                <span className="text-gray-300">·</span>
                <span>{formatDistance(listing.distance_from_gate, UNIVERSITIES.find(u => u.id === listing.university)?.shortName)}</span>
              </p>
            </div>
            
            <div className="flex items-end justify-between border-t border-gray-50 pt-4 sm:border-0 sm:pt-0 sm:block sm:text-right">
              <div>
                <p className="text-2xl font-black text-[#1B4332] sm:text-3xl">
                  {formatNaira(listing.price_yearly)}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 sm:text-xs">
                  Per Academic Year
                </p>
              </div>
              <div className="sm:mt-2">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Available Now
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="px-0 sm:px-4 lg:px-0">
          <PhotoGallery photos={listing.photos} videoUrl={listing.video_url} />
        </div>

        <div className="grid grid-cols-1 gap-6 px-4 lg:grid-cols-[1fr,360px] lg:px-8">
          <div className="space-y-6">
            <ListingDetailsGrid listing={listing} />

            {/* Agent fee — driven by the fee fields on the listing (only agents
                ever set fixed/negotiable), so it shows regardless of viewport. */}
            {(listing.agent_fee_type === "fixed" || listing.agent_fee_type === "negotiable") && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Info className="w-4 h-4 text-amber-700 shrink-0" />
                  <p className="text-sm font-semibold text-amber-800">Agent Fee</p>
                </div>
                {listing.agent_fee_type === "fixed" ? (
                  <p className="text-sm text-amber-700">
                    This listing has an agent fee of {formatNaira(listing.agent_fee_amount ?? 0)}. Discuss directly with the agent.
                  </p>
                ) : (
                  <p className="text-sm text-amber-700">
                    Agent fee is negotiable from {formatNaira(listing.agent_fee_amount ?? 0)}. Discuss directly with the agent.
                  </p>
                )}
              </div>
            )}

            {listing.landlord?.role === "agent" && listing.agent_fee_type === "none" && (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-700 shrink-0" />
                  <p className="text-sm font-semibold text-green-800">No agent fee for this listing</p>
                </div>
              </div>
            )}

            {listing.description && (
              <div className="max-w-full overflow-hidden rounded-2xl border bg-white p-6">
                <h2 className="font-semibold text-lg text-gray-900 mb-3">
                  About this property
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                  {listing.description}
                </p>
              </div>
            )}

            <AmenitiesGrid amenities={listing.amenities} />
            <ReviewsSection reviews={reviews} averageRating={averageRating} />
            
            {/* Review Section Call to Action - always show form for everyone */}
            <ReviewForm listingId={listing.id} prefillName={userProfile?.full_name} />
          </div>

          <div className="space-y-6">
            <ContactCard listing={listing} />
            {landlordRowData ? (
              <LandlordCard
                landlord={landlordRowData as any}
                rating={averageRating}
                reviewCount={reviewCount}
              />
            ) : null}
          </div>
        </div>

        <div className="px-4 lg:px-8 pt-4">
          <SimilarListings currentListingId={listing.id} roomType={listing.room_type} />
        </div>
      </div>
    </main>
  )
}

