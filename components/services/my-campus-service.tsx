"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Wrench,
  Sparkles,
  Plus,
  Pencil,
  Pause,
  Play,
  Share2,
  Check,
  CheckCircle2,
  Copy,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  ThumbsUp,
  Camera,
  Loader2,
  X,
  GraduationCap,
  ShieldCheck,
  Star,
  Zap,
  CreditCard,
  Calendar,
  AlertTriangle,
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
  HelpCircle,
  ChevronRight,
  Clock,
  ArrowRight,
} from "lucide-react"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { compressImage } from "@/lib/image-compress"
import {
  SERVICE_CATEGORIES,
  SERVICE_UNIVERSITIES,
  PRICE_UNIT_SUGGESTIONS,
  CUSTOM_SERVICE_ICONS,
  CUSTOM_SERVICE_COLORS,
  formatServicePrice,
  getCategoryLabel,
} from "@/lib/service-utils"
import type { ServiceProvider, ServiceCategory, ServicePricingType, BoostType } from "@/types"

const iconComponents: Record<string, any> = {
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
  HelpCircle,
}

const serviceSchema = z.object({
  business_name: z
    .string()
    .trim()
    .min(2, "Business name must be at least 2 characters"),
  category: z.enum(
    [
      "moving",
      "cleaning",
      "gas_refill",
      "repairs",
      "painting",
      "laundry",
      "other",
    ],
    { message: "Please select a category" }
  ),
  custom_category_name: z.string().optional().nullable(),
  custom_category_icon: z.string().optional().nullable(),
  custom_category_color: z.string().optional().nullable(),
  university: z.enum(
    ["University of Port Harcourt", "Rivers State University"],
    { message: "Please select a campus" }
  ),
  pricing_type: z.enum(["negotiable", "starting_from", "fixed"]),
  price_amount: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val) return true
        const num = Number(val)
        return !isNaN(num) && num > 0
      },
      { message: "Price must be a positive number" }
    ),
  price_unit: z.string().optional().nullable(),
  whatsapp_number: z
    .string()
    .trim()
    .min(10, "Enter a valid phone number (e.g. 08012345678)"),
  is_student_owned: z.boolean().default(false),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters"),
  image_url: z.string().optional().nullable(),
}).refine(
  (data) => {
    if (data.category === "other") {
      return !!data.custom_category_name && data.custom_category_name.trim().length >= 2
    }
    return true
  },
  {
    message: "Please specify your custom service category (min 2 characters)",
    path: ["custom_category_name"],
  }
)

interface MyCampusServiceProps {
  userId: string
  defaultPhone?: string
}

export function MyCampusService({ userId, defaultPhone = "" }: MyCampusServiceProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [service, setService] = useState<ServiceProvider | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [togglingStatus, setTogglingStatus] = useState(false)
  const [payingAction, setPayingAction] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [uploadingImage, setUploadingImage] = useState(false)

  // Prices from platform_settings
  const [listingPrice, setListingPrice] = useState<number>(3000)
  const [boostPrices, setBoostPrices] = useState<{ featured_7: number; featured_30: number }>({
    featured_7: 1500,
    featured_30: 4000,
  })

  // Form State
  const [businessName, setBusinessName] = useState("")
  const [category, setCategory] = useState<ServiceCategory>("moving")
  const [customCategoryName, setCustomCategoryName] = useState("")
  const [customCategoryIcon, setCustomCategoryIcon] = useState("HelpCircle")
  const [customCategoryColor, setCustomCategoryColor] = useState("from-gray-600 to-slate-800")
  const [university, setUniversity] = useState<string>("University of Port Harcourt")
  const [pricingType, setPricingType] = useState<ServicePricingType>("negotiable")
  const [priceAmount, setPriceAmount] = useState<string>("")
  const [priceUnit, setPriceUnit] = useState<string>("")
  const [whatsappNumber, setWhatsappNumber] = useState<string>(defaultPhone)
  const [isStudentOwned, setIsStudentOwned] = useState<boolean>(true)
  const [description, setDescription] = useState<string>("")
  const [imageUrl, setImageUrl] = useState<string>("")
  const [copiedLink, setCopiedLink] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState<{
    type: string
    action: string
    boostType?: string | null
    ref?: string | null
  } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Handle URL callback notifications
  useEffect(() => {
    const payment = searchParams.get("payment")
    const error = searchParams.get("error")
    const status = searchParams.get("status")

    if (payment === "success") {
      setPaymentSuccess({
        type: searchParams.get("type") || "service_listing",
        action: searchParams.get("action") || "listing_active",
        boostType: searchParams.get("boost_type"),
        ref: searchParams.get("ref"),
      })
      showToast("Payment received successfully! Your service is active.")
    } else if (error === "payment_failed") {
      showToast("Payment was not completed. Please try again.")
    } else if (status === "processing") {
      showToast("Payment is processing. Your service will activate in a moment.")
    }
  }, [searchParams])

  const handleDismissSuccess = () => {
    setPaymentSuccess(null)
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href)
      url.searchParams.delete("payment")
      url.searchParams.delete("type")
      url.searchParams.delete("action")
      url.searchParams.delete("boost_type")
      url.searchParams.delete("service_id")
      url.searchParams.delete("ref")
      url.searchParams.delete("error")
      url.searchParams.delete("status")
      window.history.replaceState({}, "", url.pathname)
    }
  }

  const handleCopyServiceLink = async () => {
    if (!service) return
    const publicUrl = `https://www.houseplug.ng/services/${service.id}`
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopiedLink(true)
      showToast("Service link copied to clipboard!")
      setTimeout(() => setCopiedLink(false), 2500)
    } catch {
      showToast("Failed to copy link")
    }
  }

  const handleShareToWhatsApp = () => {
    if (!service) return
    const publicUrl = `https://www.houseplug.ng/services/${service.id}`
    const text = `Hello! Check out our campus service *${service.business_name}* on HousePlug!\nBook directly with us here: ${publicUrl}`
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(waUrl, "_blank", "noopener,noreferrer")
  }

  // Fetch user's service and platform pricing
  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient()

        const [{ data: serviceData }, { data: settingsData }] = await Promise.all([
          supabase
            .from("service_providers")
            .select("*")
            .eq("user_id", userId)
            .maybeSingle(),
          supabase
            .from("platform_settings")
            .select("key, value")
            .in("key", ["service_listing_price", "boost_featured_7", "boost_featured_30"]),
        ])

        if (serviceData) {
          setService(serviceData as ServiceProvider)
        } else if (searchParams.get("setup") === "service" || searchParams.get("create") === "true") {
          setIsEditing(true)
        }

        if (settingsData) {
          const map = Object.fromEntries(settingsData.map((s) => [s.key, Number(s.value)]))
          if (map.service_listing_price) {
            setListingPrice(Math.round(map.service_listing_price / 100))
          }
          if (map.boost_featured_7 || map.boost_featured_30) {
            setBoostPrices({
              featured_7: Math.round((map.boost_featured_7 ?? 150000) / 100),
              featured_30: Math.round((map.boost_featured_30 ?? 400000) / 100),
            })
          }
        }
      } catch (err) {
        console.error("Failed to load service provider data", err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [userId, searchParams])

  // Populate form when editing an existing service
  const startEdit = () => {
    if (service) {
      setBusinessName(service.business_name || "")
      setCategory((service.category as ServiceCategory) || "moving")
      setCustomCategoryName(service.custom_category_name || "")
      setCustomCategoryIcon(service.custom_category_icon || "HelpCircle")
      setCustomCategoryColor(service.custom_category_color || "from-gray-600 to-slate-800")
      setUniversity(service.university || "University of Port Harcourt")
      setPricingType((service.pricing_type as ServicePricingType) || "negotiable")
      setPriceAmount(service.price_amount ? String(service.price_amount) : "")
      setPriceUnit(service.price_unit || "")
      setWhatsappNumber(service.whatsapp_number || defaultPhone)
      setIsStudentOwned(!!service.is_student_owned)
      setDescription(service.description || "")
      setImageUrl(service.image_url || "")
    } else {
      setWhatsappNumber(defaultPhone)
    }
    setFormErrors({})
    setIsEditing(true)
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setFormErrors({})
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file.")
      return
    }

    setUploadingImage(true)
    try {
      let uploadFile = file
      try {
        uploadFile = await compressImage(file, { maxDimension: 1200, quality: 0.85, skipUnder: 0 })
      } catch {
        uploadFile = file
      }

      const supabase = createClient()
      const ext = (uploadFile.type.split("/")[1] || "jpg").replace("jpeg", "jpg")
      const filePath = `${userId}/services/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from("listings")
        .upload(filePath, uploadFile, { upsert: true })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      const { data } = supabase.storage.from("listings").getPublicUrl(filePath)
      setImageUrl(data.publicUrl)
      showToast("Photo uploaded successfully!")
    } catch (err: any) {
      console.error("Photo upload error:", err)
      showToast("Failed to upload photo. Try again.")
    } finally {
      setUploadingImage(false)
      e.target.value = ""
    }
  }

  const handleToggleStatus = async () => {
    if (!service) return
    const newStatus = service.status === "active" ? "paused" : "active"
    setTogglingStatus(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("service_providers")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", service.id)

      if (error) throw error

      setService({ ...service, status: newStatus })
      showToast(`Service is now ${newStatus === "active" ? "Active" : "Paused"}`)
    } catch (err) {
      console.error("Error updating status", err)
      showToast("Failed to update status")
    } finally {
      setTogglingStatus(false)
    }
  }

  const handleShare = async () => {
    if (!service) return
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
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
      showToast("Link copied to clipboard!")
    } catch {
      showToast("Could not copy link")
    }
  }

  // Paystack Listing Fee / Renewal Checkout
  const handlePayListingFee = async () => {
    if (!service) return
    setPayingAction("listing")
    try {
      const returnUrl = typeof window !== "undefined" ? window.location.pathname : "/services/manage"
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "service_listing",
          service_id: service.id,
          return_url: returnUrl,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to initialize payment")

      window.location.href = data.authorization_url
    } catch (err: any) {
      alert(err.message || "Failed to launch Paystack payment")
      setPayingAction(null)
    }
  }

  // Paystack Boost Checkout
  const handleBoostService = async (boostType: "featured_7" | "featured_30") => {
    if (!service) return
    setPayingAction(boostType)
    try {
      const returnUrl = typeof window !== "undefined" ? window.location.pathname : "/services/manage"
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "service_boost",
          boost_type: boostType,
          service_id: service.id,
          return_url: returnUrl,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to initialize boost payment")

      window.location.href = data.authorization_url
    } catch (err: any) {
      alert(err.message || "Failed to launch Paystack payment")
      setPayingAction(null)
    }
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors({})

    const rawData = {
      business_name: businessName,
      category,
      custom_category_name: category === "other" ? customCategoryName : null,
      custom_category_icon: category === "other" ? customCategoryIcon : null,
      custom_category_color: category === "other" ? customCategoryColor : null,
      university,
      pricing_type: pricingType,
      price_amount:
        pricingType !== "negotiable" && priceAmount.trim() !== ""
          ? Number(priceAmount)
          : null,
      price_unit:
        pricingType !== "negotiable" && priceUnit.trim() !== ""
          ? priceUnit.trim()
          : null,
      whatsapp_number: whatsappNumber,
      is_student_owned: isStudentOwned,
      description,
      image_url: imageUrl || null,
    }

    // Validate with Zod
    const validation = serviceSchema.safeParse(rawData)
    if (!validation.success) {
      const errors: Record<string, string> = {}
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          errors[String(err.path[0])] = err.message
        }
      })
      setFormErrors(errors)
      showToast("Please check the form for errors")
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient()
      const payload: Record<string, any> = {
        business_name: validation.data.business_name,
        category: validation.data.category,
        university: validation.data.university,
        pricing_type: validation.data.pricing_type,
        price_amount: validation.data.price_amount,
        price_unit: validation.data.price_unit,
        whatsapp_number: validation.data.whatsapp_number,
        is_student_owned: validation.data.is_student_owned,
        description: validation.data.description,
        image_url: validation.data.image_url,
        updated_at: new Date().toISOString(),
      }

      if (category === "other") {
        if (customCategoryName) payload.custom_category_name = customCategoryName
        if (customCategoryIcon) payload.custom_category_icon = customCategoryIcon
        if (customCategoryColor) payload.custom_category_color = customCategoryColor
      }

      if (service) {
        // Update existing service
        let { data, error } = await supabase
          .from("service_providers")
          .update(payload)
          .eq("id", service.id)
          .select()
          .single()

        // Fallback retry if custom category columns do not exist in DB schema yet
        if (error && (error.message?.includes("custom_category") || error.message?.includes("schema cache"))) {
          const basePayload = { ...payload }
          delete basePayload.custom_category_name
          delete basePayload.custom_category_icon
          delete basePayload.custom_category_color
          const fallbackRes = await supabase
            .from("service_providers")
            .update(basePayload)
            .eq("id", service.id)
            .select()
            .single()
          data = fallbackRes.data
          error = fallbackRes.error
        }

        if (error) throw error
        setService(data as ServiceProvider)
        showToast("Service updated successfully!")
        setIsEditing(false)
      } else {
        // Insert new service (pending payment)
        const insertPayload: Record<string, any> = {
          ...payload,
          user_id: userId,
          status: "active",
          listing_paid: false,
          whatsapp_clicks: 0,
          vouch_count: 0,
          is_verified: false,
        }

        let { data, error } = await supabase
          .from("service_providers")
          .insert(insertPayload)
          .select()
          .single()

        // Fallback retry if custom category or listing_paid columns do not exist in DB schema yet
        if (error && (error.message?.includes("custom_category") || error.message?.includes("listing_paid") || error.message?.includes("schema cache"))) {
          const baseInsert = { ...insertPayload }
          delete baseInsert.custom_category_name
          delete baseInsert.custom_category_icon
          delete baseInsert.custom_category_color
          delete baseInsert.listing_paid
          const fallbackRes = await supabase
            .from("service_providers")
            .insert(baseInsert)
            .select()
            .single()
          data = fallbackRes.data
          error = fallbackRes.error
        }

        if (error) throw error
        const createdService = data as ServiceProvider
        setService(createdService)
        setIsEditing(false)

        // Automatically prompt to pay ₦3,000 to activate
        showToast("Service created! Proceeding to activate your listing...")
        try {
          const res = await fetch("/api/payments/initiate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "service_listing",
              service_id: createdService.id,
              return_url: "/services/manage",
            }),
          })
          const payData = await res.json()
          if (res.ok && payData.authorization_url) {
            window.location.href = payData.authorization_url
            return
          }
        } catch (payErr) {
          console.error("Auto-redirect error", payErr)
        }
      }
    } catch (err: any) {
      console.error("Save service error:", err)
      showToast(err.message || "Failed to save service")
    } finally {
      setSubmitting(false)
    }
  }

  // Check subscription expiry logic
  const isExpired = Boolean(
    service?.listing_expires_at && new Date(service.listing_expires_at) < new Date()
  )
  const isPaidActive = Boolean(
    service?.listing_paid &&
      service?.listing_expires_at &&
      new Date(service.listing_expires_at) >= new Date()
  )
  const daysLeft = service?.listing_expires_at
    ? Math.max(
        0,
        Math.ceil(
          (new Date(service.listing_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      )
    : 0

  // Boost active check
  const isBoostActive = Boolean(
    service?.is_boosted &&
      (!service.boost_expires_at || new Date(service.boost_expires_at) >= new Date())
  )
  const boostDaysLeft = service?.boost_expires_at
    ? Math.max(
        0,
        Math.ceil(
          (new Date(service.boost_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      )
    : 0

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 flex flex-col items-center justify-center min-h-[300px] space-y-3">
        <div className="w-8 h-8 rounded-full border-3 border-[#1B4332] border-t-transparent animate-spin" />
        <p className="text-xs font-semibold text-gray-500">Loading your campus service...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1B4332] text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          {toastMessage}
        </div>
      )}

      {/* PAYMENT SUCCESS & NEXT ACTIONS BANNER */}
      {paymentSuccess && service && (
        <div className="bg-gradient-to-br from-emerald-500/15 via-emerald-50/80 to-white border-2 border-emerald-500/30 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-lg shadow-emerald-900/5 space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 sm:gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-[#1B4332] to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-[#1B4332]/20">
                <CheckCircle2 className="w-6 h-6 text-emerald-300" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider mb-1">
                  <Sparkles className="w-3 h-3 text-[#F59E0B]" /> Payment Verified
                </div>
                <h2 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight leading-snug">
                  {paymentSuccess.type === "service_boost"
                    ? "🚀 Spotlight Boost Activated!"
                    : "🎉 Your Campus Service is Now Live!"}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed max-w-2xl">
                  {paymentSuccess.type === "service_boost"
                    ? "Your boost payment was confirmed. Your service is now prominently featured in the top Featured Spotlight for students across UniPort and RSU!"
                    : "Your ₦3,000 monthly listing payment was verified via Paystack. Your business profile is active, indexed in campus search, and students can now contact you directly on WhatsApp."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismissSuccess}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
              title="Dismiss notification"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Summary Pill Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-emerald-100/80">
            <div className="flex items-center gap-1 text-xs text-emerald-900 bg-white/80 border border-emerald-200 px-3 py-1.5 rounded-xl font-semibold shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Status: <strong className="text-emerald-800">Active Listing</strong></span>
            </div>
            {paymentSuccess.ref && (
              <div className="flex items-center gap-1 text-xs text-gray-600 bg-white/80 border border-gray-200 px-3 py-1.5 rounded-xl font-medium shadow-xs">
                <span>Ref: <code className="text-gray-800 font-mono text-[11px]">{paymentSuccess.ref}</code></span>
              </div>
            )}
            <div className="flex items-center gap-1 text-xs text-gray-600 bg-white/80 border border-gray-200 px-3 py-1.5 rounded-xl font-medium shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>Duration: <strong>{paymentSuccess.type === "service_boost" ? (paymentSuccess.boostType === "featured_30" ? "30 Days Boost" : "7 Days Boost") : "30 Days Listing"}</strong></span>
            </div>
          </div>

          {/* NEXT ACTIONS BLOCK */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-200/80 space-y-3.5 shadow-xs">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Recommended Next Actions
              </span>
              <p className="text-sm font-black text-gray-900">
                Start getting bookings from students today
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {/* Action 1: View Live Listing */}
              <Link
                href={`/services/${service.id}`}
                className="flex items-center justify-center gap-2 bg-[#1B4332] hover:bg-[#143728] text-white py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm shadow-[#1B4332]/20 active:scale-[0.98]"
              >
                <ExternalLink className="w-4 h-4" />
                View Live Service
              </Link>

              {/* Action 2: Share on WhatsApp */}
              <button
                type="button"
                onClick={handleShareToWhatsApp}
                className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm shadow-[#25D366]/20 active:scale-[0.98]"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 fill-white shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.857L.054 23.338a.75.75 0 0 0 .916.916l5.481-1.478A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.694 9.694 0 0 1-4.95-1.357l-.355-.212-3.683.993.992-3.617-.232-.373A9.694 9.694 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
                </svg>
                Share on WhatsApp
              </button>

              {/* Action 3: Copy Link */}
              <button
                type="button"
                onClick={handleCopyServiceLink}
                className="flex items-center justify-center gap-2 border border-gray-200 hover:border-gray-300 bg-white text-gray-700 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-[0.98]"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-gray-500" />
                    Copy Service Link
                  </>
                )}
              </button>
            </div>

            {/* Optional Promotion / Boost tip if listing payment */}
            {paymentSuccess.type === "service_listing" && !service.is_boosted && (
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-900 leading-snug">
                    <strong>Want 5x more student inquiries?</strong> Boost your listing for 7 days (₦{boostPrices.featured_7.toLocaleString("en-NG")}) to feature in the top carousel.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleBoostService("featured_7")}
                  disabled={payingAction === "featured_7"}
                  className="shrink-0 text-xs font-bold text-amber-900 bg-white border border-amber-300 hover:bg-amber-100/50 py-1.5 px-3 rounded-lg transition-colors active:scale-95"
                >
                  Boost Now (₦{boostPrices.featured_7.toLocaleString("en-NG")})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STATE 1: Empty state (No service yet and not editing) */}
      {!service && !isEditing && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-xs p-6 sm:p-12 text-center space-y-5 sm:space-y-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-50 text-[#1B4332] flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-[#F59E0B]" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              List Your Campus Service
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Connect directly with thousands of students in UniPort and RSU for moving, lodge cleaning, gas refills, repairs, laundry, and custom student services.
            </p>
          </div>

          <div className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold max-w-full">
            <CreditCard className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Monthly Listing Fee: ₦{listingPrice.toLocaleString("en-NG")} / month</span>
          </div>

          <div>
            <button
              type="button"
              onClick={startEdit}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#1B4332] text-white px-7 py-3.5 rounded-xl sm:rounded-2xl font-bold text-sm hover:bg-[#143728] transition-all shadow-md shadow-[#1B4332]/20 hover:shadow-lg active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Set Up Your Service
            </button>
          </div>
        </div>
      )}

      {/* STATE 2: Form (Creating or Editing) */}
      {isEditing && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-xs p-4 sm:p-8 space-y-5 sm:space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-gray-900">
                {service ? "Edit Your Campus Service" : "Set Up Your Campus Service"}
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                {service
                  ? "Update your service details anytime at no extra charge."
                  : `First month listing fee of ₦${listingPrice.toLocaleString("en-NG")} payable via Paystack upon publishing.`}
              </p>
            </div>
            {service && (
              <button
                type="button"
                onClick={cancelEdit}
                className="text-gray-400 hover:text-gray-600 text-xs font-semibold flex items-center gap-1 p-1 active:scale-95"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSubmitForm} className="space-y-5 sm:space-y-6">
            {/* Photo Upload */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
                Cover Photo or Business Logo
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#1B4332] bg-gray-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group transition-colors shrink-0 active:scale-95"
                >
                  {imageUrl ? (
                    <>
                      <img src={imageUrl} alt="Service cover" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <Camera className="w-5 h-5" />
                      </div>
                    </>
                  ) : uploadingImage ? (
                    <Loader2 className="w-6 h-6 text-[#1B4332] animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-6 h-6 text-gray-400 group-hover:text-[#1B4332] mb-1 transition-colors" />
                      <span className="text-[10px] text-gray-500 font-medium">Add Photo</span>
                    </>
                  )}
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <p className="font-semibold text-gray-700">Upload business logo or photo of your work</p>
                  <p className="text-[11px] text-gray-400">Recommended: 1200x630 or square JPG, PNG, or WebP.</p>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="text-red-500 hover:underline text-xs font-medium block pt-1 active:scale-95"
                    >
                      Remove photo
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Business Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Business / Service Name *
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Sparkle Lodge Cleaners"
                className={`w-full border rounded-xl sm:rounded-2xl px-3.5 sm:px-4 py-3 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] ${
                  formErrors.business_name ? "border-red-400 bg-red-50/30" : "border-gray-200"
                }`}
              />
              {formErrors.business_name && (
                <p className="text-xs text-red-500">{formErrors.business_name}</p>
              )}
            </div>

            {/* Category & Campus grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                  className="w-full border border-gray-200 rounded-xl sm:rounded-2xl px-3.5 sm:px-4 py-3 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] bg-white font-medium"
                >
                  {SERVICE_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Campus Base *
                </label>
                <select
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl sm:rounded-2xl px-3.5 sm:px-4 py-3 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] bg-white font-medium"
                >
                  {SERVICE_UNIVERSITIES.map((uni) => (
                    <option key={uni} value={uni}>
                      {uni}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* FLEXIBLE "OTHER" SERVICE CATEGORY BUILDER */}
            {category === "other" && (
              <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-amber-50/50 border border-amber-200 space-y-3.5 sm:space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Custom Service Details
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">
                    What is your specific service? *
                  </label>
                  <input
                    type="text"
                    value={customCategoryName}
                    onChange={(e) => setCustomCategoryName(e.target.value)}
                    placeholder="e.g. Photography & Studio, Hair Styling & Braiding, Tech Repairs..."
                    className={`w-full border rounded-xl px-3.5 py-2.5 text-base sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 ${
                      formErrors.custom_category_name ? "border-red-400 bg-red-50/40" : "border-gray-200"
                    }`}
                  />
                  {formErrors.custom_category_name && (
                    <p className="text-xs text-red-500">{formErrors.custom_category_name}</p>
                  )}
                </div>

                {/* Icon Picker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Choose an Icon</label>
                  <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-6 gap-2">
                    {CUSTOM_SERVICE_ICONS.map((ic) => {
                      const IconComp = iconComponents[ic.id] || HelpCircle
                      const isSelected = customCategoryIcon === ic.id
                      return (
                        <button
                          key={ic.id}
                          type="button"
                          onClick={() => setCustomCategoryIcon(ic.id)}
                          className={`p-2 sm:p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                            isSelected
                              ? "border-[#1B4332] bg-[#1B4332] text-white shadow-xs"
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          <IconComp className="w-4 h-4" />
                          <span className="text-[10px] truncate max-w-full font-medium">
                            {ic.label.split("/")[0].trim()}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Color Theme Picker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">Badge & Header Color</label>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {CUSTOM_SERVICE_COLORS.map((col) => {
                      const isSelected = customCategoryColor === col.id
                      return (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => setCustomCategoryColor(col.id)}
                          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                            isSelected
                              ? "border-gray-900 ring-2 ring-gray-900/20 bg-white"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <span className={`w-3 h-3 rounded-full ${col.preview}`} />
                          <span className="text-gray-700">{col.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Pricing Model Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                Pricing Model *
              </label>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setPricingType("negotiable")}
                  className={`py-2.5 sm:py-3 px-1 sm:px-3 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold border-2 transition-all leading-tight text-center active:scale-95 flex items-center justify-center ${
                    pricingType === "negotiable"
                      ? "border-[#1B4332] bg-[#1B4332]/5 text-[#1B4332]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  Negotiable
                </button>
                <button
                  type="button"
                  onClick={() => setPricingType("starting_from")}
                  className={`py-2.5 sm:py-3 px-1 sm:px-3 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold border-2 transition-all leading-tight text-center active:scale-95 flex items-center justify-center ${
                    pricingType === "starting_from"
                      ? "border-[#1B4332] bg-[#1B4332]/5 text-[#1B4332]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  Starting From
                </button>
                <button
                  type="button"
                  onClick={() => setPricingType("fixed")}
                  className={`py-2.5 sm:py-3 px-1 sm:px-3 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-bold border-2 transition-all leading-tight text-center active:scale-95 flex items-center justify-center ${
                    pricingType === "fixed"
                      ? "border-[#1B4332] bg-[#1B4332]/5 text-[#1B4332]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  Fixed Rate
                </button>
              </div>
            </div>

            {/* Conditional Price Inputs */}
            {pricingType !== "negotiable" && (
              <div className="p-3.5 sm:p-4 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-3 animate-in fade-in slide-in-from-top-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">Price Amount (₦) *</label>
                    <input
                      type="number"
                      value={priceAmount}
                      onChange={(e) => setPriceAmount(e.target.value)}
                      placeholder="e.g. 3000"
                      min="100"
                      className={`w-full border rounded-xl px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 bg-white ${
                        formErrors.price_amount ? "border-red-400 bg-red-50/40" : "border-gray-300"
                      }`}
                    />
                    {formErrors.price_amount && (
                      <p className="text-xs text-red-500">{formErrors.price_amount}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-600">Rate Unit (Optional)</label>
                    <input
                      type="text"
                      value={priceUnit}
                      onChange={(e) => setPriceUnit(e.target.value)}
                      placeholder="e.g. per trip, per room"
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 bg-white"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-gray-500 font-medium">Suggestions:</span>
                  {PRICE_UNIT_SUGGESTIONS.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setPriceUnit(sug)}
                      className="text-[11px] bg-white border border-gray-300 hover:border-[#1B4332] text-gray-700 px-2 py-0.5 rounded-full transition-colors font-medium active:scale-95"
                    >
                      {sug}
                    </button>
                  ))}
                </div>

                <div className="pt-2 text-xs text-[#1B4332] font-semibold flex items-center gap-1.5 border-t border-gray-200">
                  <span>Display Preview:</span>
                  <span className="font-bold underline">
                    {formatServicePrice(pricingType, Number(priceAmount) || 0, priceUnit)}
                  </span>
                </div>
              </div>
            )}

            {/* WhatsApp Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                WhatsApp Contact Number *
              </label>
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="e.g. 08012345678"
                className={`w-full border rounded-xl sm:rounded-2xl px-3.5 sm:px-4 py-3 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] ${
                  formErrors.whatsapp_number ? "border-red-400 bg-red-50/30" : "border-gray-200"
                }`}
              />
              {formErrors.whatsapp_number && (
                <p className="text-xs text-red-500">{formErrors.whatsapp_number}</p>
              )}
              <p className="text-[11px] text-gray-400">
                Students will tap to chat directly with this number on WhatsApp.
              </p>
            </div>

            {/* Student-Owned Checkbox */}
            <label className="flex items-start gap-3 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-amber-200 bg-amber-50/50 cursor-pointer hover:bg-amber-50 active:scale-[0.99] transition-all">
              <input
                type="checkbox"
                checked={isStudentOwned}
                onChange={(e) => setIsStudentOwned(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#F59E0B] focus:ring-[#F59E0B] accent-[#F59E0B]"
              />
              <div className="text-xs">
                <span className="font-bold text-gray-900 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-[#F59E0B]" />
                  I am a student entrepreneur
                </span>
                <p className="text-gray-500 mt-0.5">
                  Adds an amber "🎓 Student-Owned" badge to build trust with student customers.
                </p>
              </div>
            </label>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Service Description *
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your service, experience, coverage areas, pricing details..."
                className={`w-full border rounded-xl sm:rounded-2xl px-3.5 sm:px-4 py-3 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] ${
                  formErrors.description ? "border-red-400 bg-red-50/30" : "border-gray-200"
                }`}
              />
              {formErrors.description && (
                <p className="text-xs text-red-500">{formErrors.description}</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-2">
              {service && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={submitting}
                  className="w-full sm:w-auto px-5 py-3.5 border border-gray-200 rounded-xl sm:rounded-2xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors text-center active:scale-[0.98]"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex-1 bg-[#1B4332] text-white py-3.5 px-6 rounded-xl sm:rounded-2xl text-sm font-bold hover:bg-[#143728] transition-all shadow-md shadow-[#1B4332]/20 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Service...
                  </>
                ) : service ? (
                  "Save Changes"
                ) : (
                  `Pay ₦${listingPrice.toLocaleString("en-NG")} & Publish Service`
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STATE 3: Dashboard View (When service exists and not editing) */}
      {service && !isEditing && (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
          {/* 1. Monthly Listing Fee & Subscription Status Card */}
          <div className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border ${
            isExpired
              ? "bg-red-50/80 border-red-200"
              : isPaidActive
              ? "bg-emerald-50/60 border-emerald-200"
              : "bg-amber-50/80 border-amber-200"
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-4">
              <div className="flex items-start gap-3 sm:gap-3.5 min-w-0">
                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${
                  isExpired
                    ? "bg-red-100 text-red-700"
                    : isPaidActive
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}>
                  {isExpired ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : isPaidActive ? (
                    <Calendar className="w-5 h-5" />
                  ) : (
                    <CreditCard className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                      {isExpired
                        ? "Listing Subscription Expired"
                        : isPaidActive
                        ? "Monthly Listing Active"
                        : "Listing Payment Pending"}
                    </h3>
                    <span className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full uppercase tracking-wider ${
                      isExpired
                        ? "bg-red-100 text-red-700"
                        : isPaidActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      {isExpired ? "Expired" : isPaidActive ? `${daysLeft} Days Left` : "Unpaid"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                    {isExpired
                      ? "Your service is currently hidden from public student searches. Renew to reactivate."
                      : isPaidActive
                      ? `Active until ${new Date(service.listing_expires_at!).toLocaleDateString("en-NG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}. Visible to all students.`
                      : `Pay ₦${listingPrice.toLocaleString("en-NG")} monthly fee to publish and keep your service live.`}
                  </p>
                </div>
              </div>

              <div className="shrink-0 w-full sm:w-auto">
                {isExpired ? (
                  <button
                    type="button"
                    onClick={handlePayListingFee}
                    disabled={payingAction === "listing"}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md shadow-red-600/20"
                  >
                    {payingAction === "listing" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4" />
                    )}
                    Renew for ₦{listingPrice.toLocaleString("en-NG")}
                  </button>
                ) : !isPaidActive ? (
                  <button
                    type="button"
                    onClick={handlePayListingFee}
                    disabled={payingAction === "listing"}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#1B4332] hover:bg-[#143728] active:scale-[0.98] text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md shadow-[#1B4332]/20"
                  >
                    {payingAction === "listing" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4" />
                    )}
                    Pay ₦{listingPrice.toLocaleString("en-NG")} & Activate
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePayListingFee}
                    disabled={payingAction === "listing"}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-white border border-gray-200 hover:border-gray-300 active:scale-[0.98] text-gray-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs"
                  >
                    {payingAction === "listing" ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    Extend 30 Days (₦{listingPrice.toLocaleString("en-NG")})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 2. Spotlight & Boost Section */}
          <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white rounded-2xl sm:rounded-3xl border border-amber-200/80 p-4 sm:p-8 space-y-4 sm:space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-base sm:text-lg">Spotlight & Boost Your Listing</h3>
                  <p className="text-xs text-gray-600">
                    Appear in the top "Featured Services" carousel on the Services page for maximum visibility.
                  </p>
                </div>
              </div>

              {isBoostActive && (
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] sm:text-xs font-black px-3 py-1 rounded-full shadow-xs">
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  Boosted ({boostDaysLeft}d left)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 pt-1">
              <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-amber-200/60 shadow-xs flex flex-col justify-between space-y-3.5 sm:space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-700">7-Day Boost</span>
                    <span className="text-base sm:text-lg font-black text-gray-900">
                      ₦{boostPrices.featured_7.toLocaleString("en-NG")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Featured placement at the very top of the Campus Services marketplace for one full week.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleBoostService("featured_7")}
                  disabled={payingAction === "featured_7"}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-[#1B4332] text-white text-xs font-bold py-3 sm:py-2.5 px-4 rounded-xl hover:bg-[#143728] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {payingAction === "featured_7" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  Boost for 7 Days
                </button>
              </div>

              <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white border border-amber-200/60 shadow-xs flex flex-col justify-between space-y-3.5 sm:space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-700">30-Day Boost</span>
                    <span className="text-base sm:text-lg font-black text-gray-900">
                      ₦{boostPrices.featured_30.toLocaleString("en-NG")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Full month priority spotlight + featured badge on your card. Best value for ongoing bookings.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleBoostService("featured_30")}
                  disabled={payingAction === "featured_30"}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs font-bold py-3 sm:py-2.5 px-4 rounded-xl hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50 shadow-xs"
                >
                  {payingAction === "featured_30" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Star className="w-3.5 h-3.5 fill-white" />
                  )}
                  Boost for 30 Days
                </button>
              </div>
            </div>
          </div>

          {/* 3. Service Card Preview & Details */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-xs p-4 sm:p-8 space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 sm:pb-5 border-b border-gray-100 gap-3 sm:gap-4">
              <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
                {service.image_url ? (
                  <img
                    src={service.image_url}
                    alt={service.business_name}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl object-cover border border-gray-200 shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-[#1B4332] text-white font-extrabold text-xl sm:text-2xl flex items-center justify-center shrink-0">
                    {service.business_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <h3 className="font-black text-gray-900 text-base sm:text-lg truncate max-w-full">
                      {service.business_name}
                    </h3>
                    {isBoostActive && (
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Featured
                      </span>
                    )}
                    {service.is_verified && (
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="w-3 h-3" /> Verified
                      </span>
                    )}
                    {service.is_student_owned && (
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-[#F59E0B] border border-amber-200">
                        🎓 Student-Owned
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {getCategoryLabel(service.category, service.custom_category_name)} • {service.university}
                  </p>
                  <p className="text-sm sm:text-base font-black text-[#1B4332] mt-0.5">
                    {formatServicePrice(service.pricing_type, service.price_amount, service.price_unit)}
                  </p>
                </div>
              </div>

              <div className="w-full sm:w-auto">
                <Link
                  href={`/services/${service.id}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#1B4332] bg-[#1B4332]/5 hover:bg-[#1B4332]/10 px-3.5 py-2.5 sm:py-2 rounded-xl transition-colors active:scale-95"
                >
                  View Public Page <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                About Your Service
              </label>
              <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                {service.description}
              </p>
            </div>

            {/* Live Analytics Dashboard */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
              <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center gap-2.5 sm:gap-3.5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">{service.whatsapp_clicks || 0}</p>
                  <p className="text-[10px] sm:text-xs font-semibold text-gray-500 truncate">WhatsApp Bookings</p>
                </div>
              </div>

              <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-amber-50/70 border border-amber-100 flex items-center gap-2.5 sm:gap-3.5">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-100 text-[#F59E0B] flex items-center justify-center shrink-0">
                  <ThumbsUp className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">{service.vouch_count || 0}</p>
                  <p className="text-[10px] sm:text-xs font-semibold text-gray-500 truncate">Student Vouches</p>
                </div>
              </div>
            </div>

            {/* Action Buttons: Edit, Pause/Activate, Share My Service Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-1 sm:pt-2">
              <button
                type="button"
                onClick={startEdit}
                className="flex items-center justify-center gap-2 border border-gray-200 hover:border-gray-300 py-3.5 sm:py-3 px-4 rounded-xl text-sm font-bold text-gray-700 transition-colors bg-white hover:bg-gray-50 active:scale-[0.98]"
              >
                <Pencil className="w-4 h-4 text-gray-500" />
                Edit Details
              </button>

              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={togglingStatus}
                className={`flex items-center justify-center gap-2 border py-3.5 sm:py-3 px-4 rounded-xl text-sm font-bold transition-colors active:scale-[0.98] ${
                  service.status === "active"
                    ? "border-amber-200 text-amber-700 bg-amber-50/50 hover:bg-amber-50"
                    : "border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50"
                }`}
              >
                {service.status === "active" ? (
                  <>
                    <Pause className="w-4 h-4" /> Pause Listing
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Activate Listing
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="flex items-center justify-center gap-2 bg-[#1B4332] text-white py-3.5 sm:py-3 px-4 rounded-xl text-sm font-bold hover:bg-[#143728] transition-colors shadow-xs shadow-[#1B4332]/20 active:scale-[0.98]"
              >
                <Share2 className="w-4 h-4" />
                Share Service
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
