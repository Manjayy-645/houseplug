"use client"

import { useState } from "react"
import { BadgeCheck, Phone, Star, Building2, MapPin } from "lucide-react"
import { ListingCard } from "@/components/listing-card"
import type { Listing, Profile } from "@/types"

// We create a custom WhatsApp icon matching the design
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.052 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
)

type ProfileClientProps = {
  profile: Profile
  listings: Listing[]
  reviewsCount: number
  averageRating: number
  yearsOnPlatform: number
}

export function ProfileClient({ profile, listings, reviewsCount, averageRating, yearsOnPlatform }: ProfileClientProps) {
  const [activeTab, setActiveTab] = useState<"listings" | "reviews">("listings")
  const isVerified = profile.verification_status === "verified"
  
  // Use first listing's whatsapp or phone as default if profile doesn't have it explicitly
  const whatsappNumber = listings.find(l => l.whatsapp_number)?.whatsapp_number || profile.phone
  const phoneNumber = profile.phone || listings.find(l => l.phone_number)?.phone_number

  const handleWhatsAppClick = () => {
    if (whatsappNumber) {
      window.open(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}`, '_blank')
    }
  }

  const handlePhoneClick = () => {
    if (phoneNumber) {
      window.open(`tel:${phoneNumber}`, '_self')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Top Banner section */}
      <div className="bg-[#1B4332] rounded-b-[2rem] pt-6 pb-8 px-4 text-white relative">
        <div className="flex items-center gap-2 mb-6">
          <Building2 className="w-5 h-5" />
          <span className="font-bold text-lg">HousePlug</span>
          <span className="ml-auto bg-white/20 px-3 py-1 rounded-full text-xs flex items-center gap-1 backdrop-blur-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Agent Profile
          </span>
        </div>

        <div className="flex flex-col items-center mt-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border-4 border-emerald-500 overflow-hidden bg-gray-200">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 font-bold text-2xl uppercase">
                  {profile.full_name.charAt(0)}
                </div>
              )}
            </div>
            {/* Green glow effect behind image could be done with absolute inset but border works */}
            <div className="absolute inset-0 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] pointer-events-none"></div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <h1 className="text-xl font-bold">{profile.full_name}</h1>
            {isVerified && (
              <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <BadgeCheck className="w-3 h-3" />
                Verified Agent
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 mt-2 text-sm text-gray-300">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {listings.length} Listings
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 text-amber-400">
              {averageRating.toFixed(1)} <Star className="w-4 h-4 fill-current" />
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {yearsOnPlatform}yr on HousePlug
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 mt-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <span className="font-bold text-lg">Contact</span>
          <div className="flex gap-3 flex-1 justify-end">
            <button 
              onClick={handleWhatsAppClick}
              className="flex-1 max-w-[140px] bg-[#0E9F6E] hover:bg-[#057A55] text-white rounded-lg py-2.5 px-4 font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <WhatsAppIcon className="w-5 h-5" />
              WhatsApp
            </button>
            <button 
              onClick={handlePhoneClick}
              className="flex-1 max-w-[140px] bg-[#0E9F6E] hover:bg-[#057A55] text-white rounded-lg py-2.5 px-4 font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Phone className="w-4 h-4 fill-current" />
              Phone
            </button>
          </div>
        </div>

        <div className="flex border-b border-gray-200 mb-6">
          <button 
            className={`flex-1 pb-3 text-center font-bold text-[17px] transition-colors relative ${activeTab === 'listings' ? 'text-[#F59E0B]' : 'text-gray-500'}`}
            onClick={() => setActiveTab('listings')}
          >
            Listings
            {activeTab === 'listings' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F59E0B]" />
            )}
          </button>
          <button 
            className={`flex-1 pb-3 text-center text-[17px] transition-colors relative ${activeTab === 'reviews' ? 'text-gray-900 font-bold' : 'text-gray-500'}`}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews
            {activeTab === 'reviews' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
            )}
          </button>
        </div>

        {activeTab === 'listings' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
            {listings.length > 0 ? (
              listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-gray-500">
                This agent has no active listings.
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="py-8 text-center text-gray-500 bg-white rounded-xl border border-gray-100 shadow-sm">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-bold text-lg text-gray-900">No Reviews Yet</h3>
            <p className="text-sm">This agent hasn't received any reviews.</p>
          </div>
        )}
      </div>
    </div>
  )
}
