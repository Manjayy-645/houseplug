"use client"

import Link from "next/link"
import Image from "next/image"
import { BadgeCheck, Heart, MapPin, Star, Flame, GraduationCap, Users, Play } from "lucide-react"
import { formatDistance, formatNaira, formatRoomType } from "@/lib/utils"
import { streamableVideoUrl, getSafariCompatibleVideoUrl } from "@/lib/cloudinary"
import { UNIVERSITIES } from "@/lib/constants"
import { UniversityLogo } from "@/components/university-logo"
import SaveButton from "@/components/listing/save-button"
import type { Listing } from "@/types"

type ListingCardProps = {
  listing: Listing
  index?: number
}

export function ListingCard({ listing, index = 1 }: ListingCardProps) {
  const photo = listing.photos?.[0]
  const videoUrl = listing.video_url
  const isVerified = listing.landlord?.verification_status === "verified"
  const isFeatured = listing.is_featured
  
  const reviews = listing.reviews ?? []
  const reviewCount = reviews.length
  const averageRating =
    reviewCount > 0
      ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviewCount
      : 0
  const landlordName = (listing.landlord as any)?.full_name ?? "Verified Landlord"
  const university = UNIVERSITIES.find(u => u.id === listing.university)

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group cursor-pointer border border-gray-100">
      <Link href={`/listing/${listing.id}`} className="block relative aspect-[16/9] overflow-hidden">
        {photo ? (
          index === 0 ? (
            <img
              src={photo}
              alt={listing.title}
              loading="eager"
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <img
              src={photo}
              alt={listing.title}
              loading="lazy"
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            />
          )
        ) : videoUrl ? (
          <>
            {/* #t=0.1 nudges the browser to render the first frame as a poster */}
            <video
              src={`${getSafariCompatibleVideoUrl(videoUrl)}#t=0.1`}
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="rounded-full bg-black/50 p-3">
                <Play className="h-5 w-5 fill-white text-white" />
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
            <span className="text-sm font-medium">No image available</span>
          </div>
        )}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
          <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-sm text-[10px] font-bold uppercase text-primary">
            {formatRoomType(listing.room_type)}
          </span>
          {isFeatured && (
            <span className="inline-flex items-center gap-1 bg-[#F59E0B] text-white px-2 py-0.5 rounded-full text-xs font-medium">
              <Star className="h-3 w-3 fill-current" /> Featured
            </span>
          )}
          {listing.is_urgent && (
            <span className="inline-flex items-center gap-1 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
              <Flame className="h-3 w-3" /> Urgent
            </span>
          )}
          {listing.landlord?.role === "agent" && (
            <span className="inline-flex items-center gap-1 bg-blue-500 text-white text-[10px] font-bold uppercase px-2 py-0.5 rounded">
              <Users className="w-2.5 h-2.5" /> Agent
            </span>
          )}
          {(listing.views_count || 0) >= 50 ? (
            <span className="inline-flex items-center gap-1 bg-[#F59E0B] text-white px-2.5 py-0.5 rounded-xl text-[10px] font-bold shadow-sm">
              <Flame className="h-3 w-3" /> High interest
            </span>
          ) : (listing.views_count || 0) >= 20 ? (
            <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur text-gray-800 px-2.5 py-0.5 rounded-xl text-[10px] font-bold shadow-sm border border-gray-100">
              <Flame className="h-3 w-3 text-[#F59E0B]" /> {Math.floor((listing.views_count || 0) / 5) * 5}+ views
            </span>
          ) : null}
        </div>
        <SaveButton 
          listingId={listing.id} 
          initialSaved={listing.is_saved || false}
          className="absolute top-4 right-4 z-10"
        />
      </Link>
      
      <div className="p-5">
        <Link href={`/listing/${listing.id}`} className="block">
          <div className="flex justify-between items-start mb-2 gap-2">
            <h3 className="font-title-md text-primary truncate flex-1">{listing.title}</h3>
            {isVerified && (
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1 shrink-0">
                <BadgeCheck className="h-3 w-3" />
                Verified
              </span>
            )}
          </div>
        </Link>
        
        <div className="flex flex-col gap-1 mb-4">
          <p className="text-gray-500 text-sm flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {formatDistance(listing.distance_from_gate, university?.shortName)}
          </p>
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 ml-5">
            {university ? (
              <UniversityLogo university={university} size={16} />
            ) : (
              <GraduationCap className="h-3.5 w-3.5" />
            )}
            {university?.shortName ?? 'Near Campus'}
          </span>
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t border-gray-50">
          <div>
            <span className="text-primary font-bold text-xl">{formatNaira(listing.price_yearly)}</span>
            <span className="text-gray-400 text-xs">/yr</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-gray-500 text-[10px] font-medium truncate max-w-[100px]">{landlordName}</span>
            {reviewCount > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span className="text-[10px] font-bold text-gray-700">{averageRating.toFixed(1)}</span>
                <span className="text-[10px] text-gray-500">· {reviewCount}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
