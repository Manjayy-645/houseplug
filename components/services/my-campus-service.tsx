"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
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
  AlertCircle,
  ExternalLink,
  MessageCircle,
  ThumbsUp,
  Camera,
  Loader2,
  X,
  GraduationCap,
  ShieldCheck,
} from "lucide-react"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { compressImage } from "@/lib/image-compress"
import {
  SERVICE_CATEGORIES,
  SERVICE_UNIVERSITIES,
  PRICE_UNIT_SUGGESTIONS,
  formatServicePrice,
  getCategoryLabel,
} from "@/lib/service-utils"
import type { ServiceProvider, ServiceCategory, ServicePricingType } from "@/types"

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
})

interface MyCampusServiceProps {
  userId: string
  defaultPhone?: string
}

export function MyCampusService({ userId, defaultPhone = "" }: MyCampusServiceProps) {
  const searchParams = useSearchParams()
  const [service, setService] = useState<ServiceProvider | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [togglingStatus, setTogglingStatus] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [uploadingImage, setUploadingImage] = useState(false)

  // Form State
  const [businessName, setBusinessName] = useState("")
  const [category, setCategory] = useState<ServiceCategory>("moving")
  const [university, setUniversity] = useState<string>("University of Port Harcourt")
  const [pricingType, setPricingType] = useState<ServicePricingType>("negotiable")
  const [priceAmount, setPriceAmount] = useState<string>("")
  const [priceUnit, setPriceUnit] = useState<string>("")
  const [whatsappNumber, setWhatsappNumber] = useState<string>(defaultPhone)
  const [isStudentOwned, setIsStudentOwned] = useState<boolean>(true)
  const [description, setDescription] = useState<string>("")
  const [imageUrl, setImageUrl] = useState<string>("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Fetch the user's service
  useEffect(() => {
    async function loadService() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("service_providers")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle()

        if (!error && data) {
          setService(data as ServiceProvider)
        } else if (searchParams.get("setup") === "service") {
          setIsEditing(true)
        }
      } catch (err) {
        console.error("Failed to load service provider profile", err)
      } finally {
        setLoading(false)
      }
    }
    loadService()
  }, [userId, searchParams])

  // Populate form when editing an existing service
  const startEdit = () => {
    if (service) {
      setBusinessName(service.business_name || "")
      setCategory((service.category as ServiceCategory) || "moving")
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
        // Fallback to clipboard if share was cancelled or failed
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
      showToast("Link copied to clipboard!")
    } catch {
      showToast("Could not copy link")
    }
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors({})

    const rawData = {
      business_name: businessName,
      category,
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
      const payload = {
        ...validation.data,
        updated_at: new Date().toISOString(),
      }

      if (service) {
        // Update
        const { data, error } = await supabase
          .from("service_providers")
          .update(payload)
          .eq("id", service.id)
          .select()
          .single()

        if (error) throw error
        setService(data as ServiceProvider)
        showToast("Service updated successfully!")
      } else {
        // Insert
        const { data, error } = await supabase
          .from("service_providers")
          .insert({
            ...payload,
            user_id: userId,
            status: "active",
            whatsapp_clicks: 0,
            vouch_count: 0,
            is_verified: false,
          })
          .select()
          .single()

        if (error) throw error
        setService(data as ServiceProvider)
        showToast("Campus service listed successfully!")
      }

      setIsEditing(false)
    } catch (err: any) {
      console.error("Save service error:", err)
      showToast(err.message || "Failed to save service")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-center min-h-[140px]">
        <div className="w-6 h-6 rounded-full border-2 border-[#1B4332] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6 relative">
      {/* Toast popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1B4332] text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#1B4332]/10 flex items-center justify-center text-[#1B4332]">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-base">My Campus Service</h2>
            <p className="text-xs text-gray-500">Provide services to students in Port Harcourt</p>
          </div>
        </div>

        {service && !isEditing && (
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
              service.status === "active"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-gray-100 text-gray-600 border border-gray-200"
            }`}
          >
            {service.status === "active" ? "Active" : "Paused"}
          </span>
        )}
      </div>

      {/* STATE 1: Empty state (No service yet and not editing) */}
      {!service && !isEditing && (
        <div className="text-center py-6 px-4 space-y-4">
          <div className="w-14 h-14 rounded-full bg-amber-50 text-[#F59E0B] flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="max-w-sm mx-auto space-y-1">
            <h3 className="font-bold text-gray-900 text-lg">Offer a Campus Service</h3>
            <p className="text-sm text-gray-500">
              Provide moving, room cleaning, gas delivery, painting, or repairs to students across UniPort and RSU.
            </p>
          </div>
          <button
            type="button"
            onClick={startEdit}
            className="inline-flex items-center gap-2 bg-[#1B4332] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#143728] transition-all shadow-sm shadow-[#1B4332]/20"
          >
            <Plus className="w-4 h-4" />
            List Your Service
          </button>
        </div>
      )}

      {/* STATE 2: Form (Creating or Editing) */}
      {isEditing && (
        <form onSubmit={handleSubmitForm} className="space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">
              {service ? "Edit Your Campus Service" : "Set Up Your Service"}
            </h3>
            {service && (
              <button
                type="button"
                onClick={cancelEdit}
                className="text-gray-400 hover:text-gray-600 text-xs font-semibold flex items-center gap-1"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            )}
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Service Cover Photo (Optional)
            </label>
            <div className="flex items-center gap-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#1B4332] bg-gray-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group transition-colors shrink-0"
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
                <p className="font-medium text-gray-700">Upload business logo or work photo</p>
                <p>Recommended: 1200x630 or square JPG, PNG, or WebP.</p>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="text-red-500 hover:underline text-xs font-medium block pt-1"
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
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Business / Service Name *
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Sparkle Lodge Cleaners"
              className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] ${
                formErrors.business_name ? "border-red-400 bg-red-50/30" : "border-gray-200"
              }`}
            />
            {formErrors.business_name && (
              <p className="text-xs text-red-500">{formErrors.business_name}</p>
            )}
          </div>

          {/* Category & Campus grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ServiceCategory)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] bg-white"
              >
                {SERVICE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Campus Base *
              </label>
              <select
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] bg-white"
              >
                {SERVICE_UNIVERSITIES.map((uni) => (
                  <option key={uni} value={uni}>
                    {uni}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing Type Selector (3 Pill Toggles) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Pricing Model *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPricingType("negotiable")}
                className={`py-2 px-3 rounded-xl text-xs font-bold border-2 transition-all ${
                  pricingType === "negotiable"
                    ? "border-[#1B4332] bg-[#1B4332]/5 text-[#1B4332]"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                Negotiable / Quote
              </button>
              <button
                type="button"
                onClick={() => setPricingType("starting_from")}
                className={`py-2 px-3 rounded-xl text-xs font-bold border-2 transition-all ${
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
                className={`py-2 px-3 rounded-xl text-xs font-bold border-2 transition-all ${
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
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-3 animate-in fade-in slide-in-from-top-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">
                    Price Amount (₦) *
                  </label>
                  <input
                    type="number"
                    value={priceAmount}
                    onChange={(e) => setPriceAmount(e.target.value)}
                    placeholder="e.g. 3000"
                    min="100"
                    className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 bg-white ${
                      formErrors.price_amount ? "border-red-400 bg-red-50/40" : "border-gray-300"
                    }`}
                  />
                  {formErrors.price_amount && (
                    <p className="text-xs text-red-500">{formErrors.price_amount}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600">
                    Rate Unit (Optional)
                  </label>
                  <input
                    type="text"
                    value={priceUnit}
                    onChange={(e) => setPriceUnit(e.target.value)}
                    placeholder="e.g. per trip, per room"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 bg-white"
                  />
                </div>
              </div>

              {/* Quick suggestion chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-gray-500 font-medium">Suggestions:</span>
                {PRICE_UNIT_SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setPriceUnit(sug)}
                    className="text-[11px] bg-white border border-gray-300 hover:border-[#1B4332] text-gray-700 px-2 py-0.5 rounded-full transition-colors font-medium"
                  >
                    {sug}
                  </button>
                ))}
              </div>

              {/* Preview */}
              <div className="pt-2 text-xs text-[#1B4332] font-semibold flex items-center gap-1.5 border-t border-gray-200">
                <span>Display Preview:</span>
                <span className="font-bold underline">
                  {formatServicePrice(pricingType, Number(priceAmount) || 0, priceUnit)}
                </span>
              </div>
            </div>
          )}

          {/* WhatsApp Number */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              WhatsApp Contact Number *
            </label>
            <input
              type="tel"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="e.g. 08012345678"
              className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] ${
                formErrors.whatsapp_number ? "border-red-400 bg-red-50/30" : "border-gray-200"
              }`}
            />
            {formErrors.whatsapp_number && (
              <p className="text-xs text-red-500">{formErrors.whatsapp_number}</p>
            )}
            <p className="text-[11px] text-gray-400">
              Students will click to message this number directly on WhatsApp.
            </p>
          </div>

          {/* Student Entrepreneur Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 cursor-pointer hover:bg-amber-50 transition-colors">
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
                  Adds a prominent amber "🎓 Student-Owned" badge to your card to boost trust with peers.
                </p>
              </div>
            </label>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Service Description *
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you offer, operating hours, delivery process, and pricing notes..."
              className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/20 focus:border-[#1B4332] ${
                formErrors.description ? "border-red-400 bg-red-50/30" : "border-gray-200"
              }`}
            />
            {formErrors.description && (
              <p className="text-xs text-red-500">{formErrors.description}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-[#1B4332] text-white py-3 px-4 rounded-xl text-sm font-semibold hover:bg-[#143728] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Service...
                </>
              ) : service ? (
                "Save Changes"
              ) : (
                "Publish Service"
              )}
            </button>
            {service && (
              <button
                type="button"
                onClick={cancelEdit}
                disabled={submitting}
                className="px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* STATE 3: Vendor Dashboard View (When service exists and not editing) */}
      {service && !isEditing && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Card Preview Header */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {service.image_url ? (
                <img
                  src={service.image_url}
                  alt={service.business_name}
                  className="w-16 h-16 rounded-xl object-cover border border-gray-200 shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-[#1B4332] text-white font-extrabold text-2xl flex items-center justify-center shrink-0">
                  {service.business_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-gray-900 text-base">{service.business_name}</h3>
                  {service.is_verified && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  )}
                  {service.is_student_owned && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-[#F59E0B] border border-amber-200">
                      🎓 Student-Owned
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {getCategoryLabel(service.category)} • {service.university}
                </p>
                <p className="text-sm font-bold text-[#1B4332] mt-1">
                  {formatServicePrice(service.pricing_type, service.price_amount, service.price_unit)}
                </p>
              </div>
            </div>

            <Link
              href={`/services/${service.id}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#1B4332] hover:underline shrink-0"
            >
              Public Page <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Description snippet */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              About Your Service
            </label>
            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
              {service.description}
            </p>
          </div>

          {/* Live Analytics Dashboard */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">{service.whatsapp_clicks || 0}</p>
                <p className="text-xs font-medium text-gray-500">WhatsApp Bookings</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-[#F59E0B] flex items-center justify-center shrink-0">
                <ThumbsUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">{service.vouch_count || 0}</p>
                <p className="text-xs font-medium text-gray-500">Student Vouches</p>
              </div>
            </div>
          </div>

          {/* Action Buttons: Edit, Pause/Activate, Share My Service Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <button
              type="button"
              onClick={startEdit}
              className="flex items-center justify-center gap-1.5 border border-gray-200 hover:border-gray-300 py-2.5 px-4 rounded-xl text-sm font-semibold text-gray-700 transition-colors bg-white hover:bg-gray-50"
            >
              <Pencil className="w-4 h-4 text-gray-500" />
              Edit
            </button>

            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={togglingStatus}
              className={`flex items-center justify-center gap-1.5 border py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors ${
                service.status === "active"
                  ? "border-amber-200 text-amber-700 bg-amber-50/50 hover:bg-amber-50"
                  : "border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50"
              }`}
            >
              {service.status === "active" ? (
                <>
                  <Pause className="w-4 h-4" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Activate
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="flex items-center justify-center gap-1.5 bg-[#1B4332] text-white py-2.5 px-4 rounded-xl text-sm font-semibold hover:bg-[#143728] transition-colors shadow-sm shadow-[#1B4332]/20"
            >
              <Share2 className="w-4 h-4" />
              Share Card
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
