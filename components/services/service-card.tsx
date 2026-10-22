"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Share2,
  ThumbsUp,
  ShieldCheck,
  GraduationCap,
  MapPin,
  Check,
  Truck,
  Sparkles,
  Flame,
  Wrench,
  Paintbrush,
  Shirt,
  HelpCircle,
  Camera,
  Scissors,
  Palette,
  ShoppingBag,
  Music,
  BookOpen,
  Utensils,
  Monitor,
  Dumbbell,
  Briefcase,
  Heart,
  Star,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  formatServicePrice,
  getCategoryLabel,
  buildServiceWhatsAppUrl,
} from "@/lib/service-utils"
import type { ServiceProvider, ServiceCategory } from "@/types"

const categoryIconMap: Record<string, any> = {
  moving: Truck,
  cleaning: Sparkles,
  gas_refill: Flame,
  repairs: Wrench,
  painting: Paintbrush,
  laundry: Shirt,
  other: HelpCircle,
  Camera,
  Scissors,
  Palette,
  ShoppingBag,
  Music,
  BookOpen,
  Utensils,
  Wrench,
  Monitor,
  Dumbbell,
  Briefcase,
  Heart,
}

interface ServiceCardProps {
  service: ServiceProvider
  onToast?: (msg: string) => void
}

export function ServiceCard({ service, onToast }: ServiceCardProps) {
  const [vouchCount, setVouchCount] = useState<number>(service.vouch_count || 0)
  const [hasVouched, setHasVouched] = useState<boolean>(false)
  const [vouching, setVouching] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`hp_vouched_${service.id}`)
      if (stored === "true") {
        setHasVouched(true)
      }
    }
  }, [service.id])

  const handleWhatsAppBooking = async () => {
    try {
      const supabase = createClient()
      // Increment WhatsApp booking click
      await supabase.rpc("increment_service_stat", {
        service_id: service.id,
        stat_type: "click",
      })
    } catch (err) {
      console.error("Failed to increment click stat", err)
    }

    const url = buildServiceWhatsAppUrl(service)
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const handleVouch = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (hasVouched || vouching) {
      if (onToast) onToast("You already vouched for this service!")
      return
    }

    setVouching(true)
    setVouchCount((prev) => prev + 1)
    setHasVouched(true)

    if (typeof window !== "undefined") {
      localStorage.setItem(`hp_vouched_${service.id}`, "true")
    }

    try {
      const supabase = createClient()
      await supabase.rpc("increment_service_stat", {
        service_id: service.id,
        stat_type: "vouch",
      })
      if (onToast) onToast("Thank you for vouching for this vendor!")
    } catch (err) {
      console.error("Failed to vouch", err)
    } finally {
      setVouching(false)
    }
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const shareUrl = `https://www.houseplug.ng/services/${service.id}`
    const shareTitle = `${service.business_name} | HousePlug Campus Services`
    const shareText = `Check out ${service.business_name} on HousePlug!`

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        })
        return
      } catch (err) {
        // User cancelled or fell through, proceed to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
      if (onToast) onToast("Link copied to clipboard!")
    } catch {
      if (onToast) onToast("Could not copy link")
    }
  }

  const CategoryIcon =
    service.category === "other" && service.custom_category_icon
      ? categoryIconMap[service.custom_category_icon] || HelpCircle
      : categoryIconMap[service.category as ServiceCategory] || HelpCircle

  const categoryLabel = getCategoryLabel(service.category, service.custom_category_name)
  const categoryColor =
    service.category === "other" && service.custom_category_color
      ? service.custom_category_color
      : "from-[#1B4332] to-[#2D5A47]"

  const formattedPrice = formatServicePrice(
    service.pricing_type,
    service.price_amount,
    service.price_unit
  )

  return (
    <div className={`group rounded-2xl border bg-white shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between ${
      service.is_boosted ? "border-amber-300 ring-2 ring-amber-400/20" : "border-gray-200/80"
    }`}>
      <div>
        {/* Card Header / Image */}
        <Link href={`/services/${service.id}`} className="block relative h-44 sm:h-48 w-full bg-gray-100 overflow-hidden">
          {service.image_url ? (
            <img
              src={service.image_url}
              alt={service.business_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${categoryColor} flex flex-col items-center justify-center text-white p-4`}>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-1.5 sm:mb-2">
                <CategoryIcon className="w-6 h-6 sm:w-7 sm:h-7 text-[#F59E0B]" />
              </div>
              <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider text-center line-clamp-1 px-2">
                {categoryLabel}
              </span>
            </div>
          )}

          {/* Badges in top corners */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between pointer-events-none gap-1.5">
            <div className="flex flex-wrap gap-1 max-w-[70%]">
              {service.is_boosted && (
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-sm">
                  <Star className="w-3 h-3 fill-white text-white" /> Featured
                </span>
              )}
              {service.is_verified && (
                <span className="inline-flex items-center gap-1 bg-[#10B981] text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-sm">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              )}
              {service.is_student_owned && (
                <span className="inline-flex items-center gap-1 bg-[#F59E0B] text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-sm">
                  <GraduationCap className="w-3 h-3" /> Student-Owned
                </span>
              )}
            </div>

            <span className="text-[10px] sm:text-[11px] font-bold bg-white/95 backdrop-blur-md text-gray-800 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full shadow-sm border border-white/40 max-w-[105px] sm:max-w-[120px] truncate">
              {categoryLabel}
            </span>
          </div>
        </Link>

        {/* Card Body */}
        <div className="p-3.5 sm:p-4 space-y-2.5 sm:space-y-3">
          <div>
            <Link href={`/services/${service.id}`}>
              <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-snug hover:text-[#1B4332] transition-colors line-clamp-1">
                {service.business_name}
              </h3>
            </Link>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">{service.university}</span>
            </div>
          </div>

          {/* Flexible Price Tag in Brand Green #1B4332 */}
          <div className="bg-[#1B4332]/5 rounded-xl px-3 py-2 border border-[#1B4332]/10 flex items-center justify-between">
            <span className="text-[11px] sm:text-xs text-gray-500 font-medium">Pricing</span>
            <span className="text-sm sm:text-base font-extrabold text-[#1B4332]">
              {formattedPrice}
            </span>
          </div>

          {/* Description snippet */}
          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
            {service.description}
          </p>
        </div>
      </div>

      {/* Action Bar at bottom */}
      <div className="p-3.5 pt-0 sm:p-4 sm:pt-0">
        <div className="pt-2.5 sm:pt-3 border-t border-gray-100 flex items-center gap-2">
          {/* 1. Book on WhatsApp Primary Button */}
          <button
            type="button"
            onClick={handleWhatsAppBooking}
            className="flex-1 bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-white font-bold text-xs py-3 sm:py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-[#25D366]/20"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 fill-white shrink-0"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.857L.054 23.338a.75.75 0 0 0 .916.916l5.481-1.478A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.694 9.694 0 0 1-4.95-1.357l-.355-.212-3.683.993.992-3.617-.232-.373A9.694 9.694 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
            </svg>
            Book on WhatsApp
          </button>

          {/* 2. Vouch Button */}
          <button
            type="button"
            onClick={handleVouch}
            title={hasVouched ? "You vouched for this vendor" : "Vouch for this vendor"}
            className={`border rounded-xl px-2.5 py-3 sm:py-2.5 text-xs font-bold transition-all flex items-center gap-1 shrink-0 active:scale-95 ${
              hasVouched
                ? "border-amber-300 bg-amber-50 text-[#F59E0B]"
                : "border-gray-200 text-gray-700 hover:border-amber-300 hover:bg-amber-50/50"
            }`}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${hasVouched ? "fill-[#F59E0B]" : ""}`} />
            <span>{vouchCount}</span>
          </button>

          {/* 3. Share Button */}
          <button
            type="button"
            onClick={handleShare}
            title="Share this service card"
            className="border border-gray-200 hover:border-gray-300 rounded-xl p-3 sm:p-2.5 text-gray-500 hover:text-gray-900 transition-colors bg-white hover:bg-gray-50 shrink-0 active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
