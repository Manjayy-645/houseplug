"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ChevronLeft,
  Share2,
  ThumbsUp,
  ShieldCheck,
  GraduationCap,
  MapPin,
  Check,
  CheckCircle2,
  Copy,
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

interface ServiceDetailViewProps {
  service: ServiceProvider
}

export function ServiceDetailView({ service }: ServiceDetailViewProps) {
  const searchParams = useSearchParams()
  const [vouchCount, setVouchCount] = useState<number>(service.vouch_count || 0)
  const [hasVouched, setHasVouched] = useState<boolean>(false)
  const [vouching, setVouching] = useState<boolean>(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      setPaymentSuccess(true)
    }
  }, [searchParams])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && user.id === service.user_id) {
        setIsOwner(true)
      }
    })
  }, [service.user_id])

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
    service.category === "other" && service.custom_category_icon
      ? categoryIconMap[service.custom_category_icon] || HelpCircle
      : categoryIconMap[service.category as ServiceCategory] || HelpCircle

  const categoryLabel = getCategoryLabel(service.category, service.custom_category_name)
  const categoryColor =
    service.category === "other" && service.custom_category_color
      ? service.custom_category_color
      : "from-[#1B4332] via-[#245742] to-[#123124]"

  const formattedPrice = formatServicePrice(
    service.pricing_type,
    service.price_amount,
    service.price_unit
  )

  return (
    <div className="min-h-screen bg-[#F9FAFB] pt-16 sm:pt-20 pb-28 sm:pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1B4332] text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#1B4332] py-1.5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Campus Services
          </Link>

          <div className="flex items-center gap-2">
            {isOwner && (
              <Link
                href="/services/manage"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B4332] bg-[#1B4332]/10 hover:bg-[#1B4332]/15 px-3 py-1.5 sm:py-2 rounded-xl transition-colors"
              >
                <Wrench className="w-3.5 h-3.5" /> Manage Service
              </Link>
            )}
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl transition-colors shadow-xs active:scale-95"
            >
              <Share2 className="w-4 h-4" /> Share Service
            </button>
          </div>
        </div>

        {/* PAYMENT SUCCESS & NEXT ACTIONS BANNER */}
        {paymentSuccess && (
          <div className="bg-gradient-to-r from-emerald-500/15 via-emerald-50 to-white border-2 border-emerald-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md shadow-emerald-900/5 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-600/30">
                <CheckCircle2 className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <h3 className="font-black text-gray-900 text-sm sm:text-base">🎉 Payment Verified — Your Service is Live!</h3>
                <p className="text-xs text-gray-600">Students across UniPort and RSU can now discover this service and book directly on WhatsApp.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={handleShare}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold py-2.5 px-3.5 rounded-xl transition-all shadow-xs active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5" /> Share on WhatsApp
              </button>
              <Link
                href="/services/manage"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-[#1B4332] text-white text-xs font-bold py-2.5 px-3.5 rounded-xl transition-all active:scale-95"
              >
                Manage Hub
              </Link>
            </div>
          </div>
        )}

        {/* Hero Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
          {/* Cover Header */}
          <div className="h-56 sm:h-80 w-full bg-gray-100 relative overflow-hidden">
            {service.image_url ? (
              <img
                src={service.image_url}
                alt={service.business_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${categoryColor} flex flex-col items-center justify-center text-white p-6`}>
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-2 sm:mb-3">
                  <CategoryIcon className="w-8 h-8 sm:w-10 sm:h-10 text-[#F59E0B]" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white/95 text-center">
                  {categoryLabel}
                </h2>
              </div>
            )}

            {/* Badges in top left */}
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-wrap gap-1.5 sm:gap-2 max-w-[90%]">
              {service.is_boosted && (
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] sm:text-xs font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-md">
                  <Star className="w-3.5 h-3.5 fill-white text-white" /> Featured
                </span>
              )}
              {service.is_verified && (
                <span className="inline-flex items-center gap-1 bg-[#10B981] text-white text-[10px] sm:text-xs font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-md">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Vendor
                </span>
              )}
              {service.is_student_owned && (
                <span className="inline-flex items-center gap-1 bg-[#F59E0B] text-white text-[10px] sm:text-xs font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-md">
                  <GraduationCap className="w-3.5 h-3.5" /> Student-Owned
                </span>
              )}
            </div>
          </div>

          {/* Details Body */}
          <div className="p-4 sm:p-8 space-y-5 sm:space-y-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 sm:gap-4">
              <div className="space-y-1 sm:space-y-1.5">
                <span className="text-[11px] sm:text-xs font-bold text-[#F59E0B] uppercase tracking-wider block">
                  {categoryLabel}
                </span>
                <h1 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight leading-snug">
                  {service.business_name}
                </h1>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 pt-0.5">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{service.university}</span>
                </div>
              </div>

              {/* Price Tag Highlight */}
              <div className="bg-[#1B4332]/5 border border-[#1B4332]/10 rounded-2xl p-3.5 sm:p-4 text-left sm:text-right shrink-0">
                <span className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                  Service Rate
                </span>
                <span className="text-lg sm:text-2xl font-black text-[#1B4332]">
                  {formattedPrice}
                </span>
              </div>
            </div>

            {/* Trust and Social Proof Badges */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 py-3 border-y border-gray-100">
              <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-200/60 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full font-medium">
                <ThumbsUp className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>
                  <strong className="text-gray-900">{vouchCount}</strong> Student{" "}
                  {vouchCount === 1 ? "Vouch" : "Vouches"}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-200/60 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full font-medium">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  <strong className="text-gray-900">{service.whatsapp_clicks || 0}</strong>{" "}
                  WhatsApp Bookings
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-200/60 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full font-medium">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>Listed on HousePlug</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5 sm:space-y-2">
              <h3 className="font-bold text-gray-900 text-sm sm:text-base">About this Service</h3>
              <p className="text-sm sm:text-base text-gray-700 whitespace-pre-line leading-relaxed">
                {service.description}
              </p>
            </div>

            {/* Primary Action Panel */}
            <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-50/60 to-emerald-100/30 rounded-2xl border border-emerald-200/80 space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm sm:text-base">Ready to book or inquire?</h4>
                  <p className="text-xs text-gray-600">
                    Connect directly on WhatsApp with verified student pricing.
                  </p>
                </div>
                <div className="text-[11px] sm:text-xs font-bold text-[#1B4332] bg-white px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-emerald-200 w-fit">
                  ⚡ Fast Response
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={handleWhatsAppBooking}
                  className="w-full sm:flex-1 bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] text-white font-extrabold text-sm py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-[#25D366]/20"
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
                  className={`w-full sm:w-auto px-5 py-3.5 rounded-xl font-bold text-sm border transition-all flex items-center justify-center gap-2 active:scale-[0.98] ${
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
        <div className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
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

      {/* Mobile Sticky Floating Contact Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200/90 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-lg flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block leading-tight">
              Rate
            </span>
            <p className="text-base font-black text-[#1B4332] truncate">
              {formattedPrice}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleVouch}
              className={`h-11 px-3 rounded-xl border flex items-center gap-1 text-xs font-bold transition-all active:scale-95 ${
                hasVouched
                  ? "bg-amber-100/80 border-amber-300 text-[#F59E0B]"
                  : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
              }`}
              title="Vouch for vendor"
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${hasVouched ? "fill-[#F59E0B]" : ""}`} />
              <span>{vouchCount}</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppBooking}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-95 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-[#25D366]/30 transition-all"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 fill-white shrink-0"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.857L.054 23.338a.75.75 0 0 0 .916.916l5.481-1.478A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.694 9.694 0 0 1-4.95-1.357l-.355-.212-3.683.993.992-3.617-.232-.373A9.694 9.694 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
              </svg>
              <span>Book on WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
