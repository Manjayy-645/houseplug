"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ChevronLeft,
  Share2,
  ThumbsUp,
  ShieldCheck,
  GraduationCap,
  MapPin,
  Check,
  MessageCircle,
  Truck,
  Sparkles,
  Flame,
  Wrench,
  Paintbrush,
  Shirt,
  HelpCircle,
  Clock,
  ArrowRight,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  formatServicePrice,
  getCategoryLabel,
  buildServiceWhatsAppUrl,
} from "@/lib/service-utils"
import type { ServiceProvider, ServiceCategory } from "@/types"

const categoryIconMap: Record<ServiceCategory, any> = {
  moving: Truck,
  cleaning: Sparkles,
  gas_refill: Flame,
  repairs: Wrench,
  painting: Paintbrush,
  laundry: Shirt,
  other: HelpCircle,
}

interface ServiceDetailViewProps {
  service: ServiceProvider
}

export function ServiceDetailView({ service }: ServiceDetailViewProps) {
  const [vouchCount, setVouchCount] = useState<number>(service.vouch_count || 0)
  const [hasVouched, setHasVouched] = useState<boolean>(false)
  const [vouching, setVouching] = useState<boolean>(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

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

  const handleVouch = async () => {
    if (hasVouched || vouching) {
      showToast("You already vouched for this vendor!")
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
      showToast("Thank you for vouching for this vendor!")
    } catch (err) {
      console.error("Failed to vouch", err)
    } finally {
      setVouching(false)
    }
  }

  const handleShare = async () => {
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
        // Fallback
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
      showToast("Link copied to clipboard!")
    } catch {
      showToast("Could not copy link")
    }
  }

  const CategoryIcon =
    categoryIconMap[service.category as ServiceCategory] || HelpCircle

  const formattedPrice = formatServicePrice(
    service.pricing_type,
    service.price_amount,
    service.price_unit
  )

  return (
    <div className="min-h-screen bg-[#F9FAFB] pt-20 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1B4332] text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#1B4332] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Campus Services
          </Link>

          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3.5 py-2 rounded-xl transition-colors shadow-sm"
          >
            <Share2 className="w-4 h-4" /> Share Service
          </button>
        </div>

        {/* Hero Card */}
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
          {/* Cover Header */}
          <div className="h-64 sm:h-80 w-full bg-gray-100 relative overflow-hidden">
            {service.image_url ? (
              <img
                src={service.image_url}
                alt={service.business_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#1B4332] via-[#245742] to-[#123124] flex flex-col items-center justify-center text-white p-6">
                <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-3">
                  <CategoryIcon className="w-10 h-10 text-[#F59E0B]" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-white/95">
                  {getCategoryLabel(service.category)}
                </h2>
              </div>
            )}

            {/* Badges in top left */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              {service.is_verified && (
                <span className="inline-flex items-center gap-1 bg-[#10B981] text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                  <ShieldCheck className="w-4 h-4" /> Verified Vendor
                </span>
              )}
              {service.is_student_owned && (
                <span className="inline-flex items-center gap-1 bg-[#F59E0B] text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                  <GraduationCap className="w-4 h-4" /> Student-Owned Business
                </span>
              )}
            </div>
          </div>

          {/* Details Body */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider block">
                  {getCategoryLabel(service.category)}
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  {service.business_name}
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-500 pt-0.5">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{service.university}</span>
                </div>
              </div>

              {/* Price Tag Highlight */}
              <div className="bg-[#1B4332]/5 border border-[#1B4332]/10 rounded-2xl p-4 text-left sm:text-right shrink-0">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  Service Rate
                </span>
                <span className="text-xl sm:text-2xl font-black text-[#1B4332]">
                  {formattedPrice}
                </span>
              </div>
            </div>

            {/* Trust and Social Proof Badges */}
            <div className="flex flex-wrap items-center gap-3 py-3 border-y border-gray-100">
              <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-200/60 px-3 py-1.5 rounded-full font-medium">
                <ThumbsUp className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>
                  <strong className="text-gray-900">{vouchCount}</strong> Student{" "}
                  {vouchCount === 1 ? "Vouch" : "Vouches"}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-200/60 px-3 py-1.5 rounded-full font-medium">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  <strong className="text-gray-900">{service.whatsapp_clicks || 0}</strong>{" "}
                  WhatsApp Bookings
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-200/60 px-3 py-1.5 rounded-full font-medium">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>Listed on HousePlug</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="font-bold text-gray-900 text-base">About this Service</h3>
              <p className="text-sm sm:text-base text-gray-700 whitespace-pre-line leading-relaxed">
                {service.description}
              </p>
            </div>

            {/* Primary Action Panel */}
            <div className="p-6 bg-gradient-to-r from-emerald-50/60 to-emerald-100/30 rounded-2xl border border-emerald-200/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-gray-900 text-base">Ready to book or inquire?</h4>
                  <p className="text-xs text-gray-600">
                    Connect directly on WhatsApp with verified student pricing.
                  </p>
                </div>
                <div className="text-xs font-bold text-[#1B4332] bg-white px-3 py-1.5 rounded-full border border-emerald-200 w-fit">
                  ⚡ Fast Response
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={handleWhatsAppBooking}
                  className="w-full sm:flex-1 bg-[#25D366] hover:bg-[#20ba59] text-white font-extrabold text-sm py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-[#25D366]/20 active:scale-[0.98]"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5 fill-white shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.857L.054 23.338a.75.75 0 0 0 .916.916l5.481-1.478A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.694 9.694 0 0 1-4.95-1.357l-.355-.212-3.683.993.992-3.617-.232-.373A9.694 9.694 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
                  </svg>
                  Book on WhatsApp
                </button>

                <button
                  type="button"
                  onClick={handleVouch}
                  className={`w-full sm:w-auto px-5 py-3.5 rounded-xl font-bold text-sm border transition-all flex items-center justify-center gap-2 ${
                    hasVouched
                      ? "bg-amber-100/80 border-amber-300 text-[#F59E0B]"
                      : "bg-white border-gray-200 text-gray-700 hover:border-amber-300 hover:bg-amber-50/50"
                  }`}
                >
                  <ThumbsUp className={`w-4 h-4 ${hasVouched ? "fill-[#F59E0B]" : ""}`} />
                  {hasVouched ? "Vouched" : "Vouch for Vendor"} ({vouchCount})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cross-Sell Footer Banner */}
        <div className="rounded-2xl border border-gray-200/80 bg-white p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Need other campus services?</h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Explore trusted movers, lodge cleaners, and gas refill vendors around UniPort and RSU.
            </p>
          </div>
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B4332] hover:underline shrink-0"
          >
            Explore Directory <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
