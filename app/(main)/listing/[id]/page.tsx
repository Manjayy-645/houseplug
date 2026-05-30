import Link from "next/link"
import { Star, Flame } from "lucide-react"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
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

type ListingDetailPageProps = {
  params: { id: string }
}

export const revalidate = 60 // revalidate every 60 seconds

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const supabase = createClient()
  const listingId = params.id

  // Safely fetch listing data, handling potential UUID format errors
  let listingRow = null
  let reviewsRows = null
  let authData = null

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(listingId)
    
    const results = await Promise.all([
      supabase.auth.getUser(),
      isUuid 
        ? supabase
            .from("listings")
            .select(`
              *,
              landlord:profiles(full_name, verification_status)
            `)
            .eq("id", listingId)
            .single()
        : Promise.resolve({ data: null }),
      isUuid
        ? supabase
            .from("reviews")
            .select("id, rating, comment, created_at, student:profiles(full_name, avatar_url)")
            .eq("listing_id", listingId)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: null })
    ])
    
    authData = results[0].data
    listingRow = results[1].data
    reviewsRows = results[2].data
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
    !landlordRowData && listingRowData
      ? supabase.from("profiles").select("id, full_name, phone, avatar_url, created_at").eq("id", listingRowData.landlord_id).single()
      : Promise.resolve({ data: null }),
    user 
      ? supabase.from("profiles").select("id, role").eq("id", user.id).single() 
      : Promise.resolve({ data: null }),
    user
      ? supabase.from("reviews").select("id").eq("listing_id", listingId).eq("student_id", user.id).maybeSingle()
      : Promise.resolve({ data: null })
  ])

  const isAdmin = userProfile?.role === "admin"
  const isOwner = user && listingRowData && user.id === listingRowData.landlord_id
  const canView = listingRowData?.status === "active" || isAdmin || isOwner

  if (!listingRowData || !canView) notFound()

  landlordRowData = landlordRowData || dbLandlordRow
  
  reviews = (reviewsRows ?? []).map((review: any) => ({
    ...review,
    student: Array.isArray(review.student) ? review.student[0] : review.student
  })) as Review[]

  const reviewCount = reviews.length
  const averageRating =
    reviewCount > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : 0

  // Increment views if it's a real listing and not viewed by owner/admin
  if (listingRow && !isOwner && !isAdmin) {
    void supabase.rpc("increment_views", { listing_id: listingId })
  }

  const listing: Listing = {
    ...(listingRowData as Listing),
    landlord: landlordRowData as unknown as any,
    reviews,
    photos: (listingRowData as any).photos ?? [],
    amenities: (listingRowData as any).amenities ?? []
  }

  return (
    <main className="min-h-screen bg-[#F9FAFB] pt-20 pb-24 lg:pt-24 lg:pb-12">
      <ViewTracker listingId={listing.id} />
      {listing.status !== "active" && (
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
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
                {listing.title}
              </h1>
              <p className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
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
          <PhotoGallery photos={listing.photos} />
        </div>

        <div className="grid grid-cols-1 gap-6 px-4 lg:grid-cols-[1fr,360px] lg:px-8">
          <div className="space-y-6">
            <ListingDetailsGrid listing={listing} />

            {listing.description && (
              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-bold text-gray-900">About this place</h2>
                <p className="mt-3 text-sm leading-relaxed text-gray-600 whitespace-pre-line">
                  {listing.description}
                </p>
              </section>
            )}

            <AmenitiesGrid amenities={listing.amenities} />
            <ReviewsSection reviews={reviews} averageRating={averageRating} />
            
            {/* Review Section Call to Action */}
            {!user ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-900">Stayed here before?</h3>
                <p className="mt-1 text-sm text-gray-600">Please log in to share your experience with other students.</p>
                <Link 
                  href="/login" 
                  className="mt-4 inline-block rounded-xl bg-[#1B4332] px-6 py-2 text-sm font-bold text-white transition hover:bg-[#2D5A47]"
                >
                  Log In to Review
                </Link>
              </div>
            ) : userProfile?.role === "student" && !existingReview ? (
              <ReviewForm listingId={listing.id} />
            ) : userProfile?.role === "student" && existingReview ? (
              <div className="rounded-2xl bg-emerald-50 p-6 text-center border border-emerald-100">
                <h3 className="text-lg font-semibold text-emerald-900">Thank you for your review!</h3>
                <p className="mt-1 text-sm text-emerald-700">You have already shared your feedback for this listing.</p>
              </div>
            ) : null}

            <SimilarListings currentListingId={listing.id} roomType={listing.room_type} />
          </div>

          <div className="space-y-6">
            <ContactCard listing={listing} />
            {landlordRowData ? (
              <LandlordCard
                landlord={landlordRowData as any}
                rating={averageRating}
                reviewCount={reviewCount}
                verificationStatus={(listingRowData as any)?.landlord?.verification_status}
              />
            ) : null}
          </div>
        </div>
      </div>
    </main>
  )
}

