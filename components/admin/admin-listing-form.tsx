"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { GripVertical, Upload, X, Video, Loader2, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { UNIVERSITIES } from "@/lib/constants"
import { AiDescribeButton } from "@/components/listing/ai-describe-button"
import { notifyAdminsNewListing, logAdminActionClient } from "@/app/actions"
import { uploadVideo, getSafariCompatibleVideoUrl, validateVideoFile } from "@/lib/cloudinary"
import { compressImage } from "@/lib/image-compress"

type AgentFeeType = "none" | "fixed" | "negotiable"

const amenityOptions = [
  "water",
  "electricity",
  "security",
  "parking",
  "prepaid_meter",
  "kitchen",
  "bathroom",
  "wifi",
]

const listingSchema = z.object({
  title: z.string().min(6, "Title is required").max(80, "Maximum 80 characters"),
  university: z.string().min(1, "University is required"),
  room_type: z.enum(["self_con", "one_bedroom", "two_bedroom", "shared"]),
  price_yearly: z.number().int().positive("Enter a valid yearly price"),
  distance_from_gate: z.enum(["under_5", "5_to_15", "15_to_30", "above_30"]),
  available_from: z.string().min(1, "Select an availability date"),
  address: z.string().min(6, "Address is required"),
  area: z.string().min(2, "Area is required"),
  landmark: z.string().optional(),
  whatsapp_number: z
    .string()
    .regex(/^(070|080|081|090)\d{8}$/, "Enter a valid Nigerian phone number"),
  phone_number: z
    .string()
    .optional()
    .refine((v) => !v || /^(070|080|081|090)\d{8}$/.test(v), "Invalid phone number"),
  amenities: z.array(z.string()).min(1, "Select at least one amenity"),
  occupancy: z.number().min(1).max(4),
  furnishing: z.enum(["furnished", "semi_furnished", "unfurnished"]),
  floor: z.enum(["ground", "upper"]),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(600),
})

type ListingFormValues = z.infer<typeof listingSchema>

type PhotoItem = {
  id: string
  file?: File
  url: string
  uploaded: boolean
  progress: number
}

interface AdminListingFormProps {
  landlordId: string      // target user's ID (not the admin)
  forUserName: string
  forUserPhone: string | null
  adminId: string
  adminName: string
  isAgent: boolean
}

const stepFields: Array<Array<keyof ListingFormValues>> = [
  ["title", "university", "room_type", "price_yearly", "distance_from_gate", "available_from"],
  ["address", "area", "landmark", "whatsapp_number", "phone_number"],
  ["amenities", "occupancy", "furnishing", "floor", "description"],
  [],
]

export function AdminListingForm({
  landlordId,
  forUserName,
  forUserPhone,
  adminId,
  adminName,
  isAgent,
}: AdminListingFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [currentStep, setCurrentStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [agentFeeType, setAgentFeeType] = useState<AgentFeeType>("none")
  const [agentFeeAmount, setAgentFeeAmount] = useState("")
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoUploading, setVideoUploading] = useState(false)
  const [photoItems, setPhotoItems] = useState<PhotoItem[]>([])
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [complete, setComplete] = useState(false)

  const defaultValues: ListingFormValues = {
    title: "",
    university: "uniport",
    room_type: "self_con",
    price_yearly: 0,
    distance_from_gate: "under_5",
    available_from: "",
    address: "",
    area: "",
    landmark: "",
    whatsapp_number: forUserPhone ?? "",
    phone_number: "",
    amenities: [],
    occupancy: 1,
    furnishing: "unfurnished",
    floor: "ground",
    description: "",
  }

  const {
    register,
    watch,
    setValue,
    getValues,
    formState: { errors },
    trigger,
  } = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues,
  })

  const titleLength = watch("title")?.length ?? 0
  const descriptionLength = watch("description")?.length ?? 0
  const progress = ((currentStep + 1) / 4) * 100
  const amenities = watch("amenities") ?? []

  const nextStep = async () => {
    const valid = await trigger(stepFields[currentStep])
    if (!valid) return
    setCurrentStep((s) => Math.min(s + 1, 3))
  }

  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 0))

  const onFilesSelected = (files: FileList | null) => {
    if (!files) return
    const selected = Array.from(files).slice(0, Math.max(0, 8 - photoItems.length))
    const mapped: PhotoItem[] = selected.map((file) => ({
      id: `new-${crypto.randomUUID()}`,
      file,
      url: URL.createObjectURL(file),
      uploaded: false,
      progress: 0,
    }))
    setPhotoItems((prev) => [...prev, ...mapped])
  }

  const removePhoto = (id: string) =>
    setPhotoItems((prev) => prev.filter((p) => p.id !== id))

  const reorderPhotos = (fromId: string, toId: string) => {
    if (fromId === toId) return
    setPhotoItems((prev) => {
      const fromIndex = prev.findIndex((p) => p.id === fromId)
      const toIndex = prev.findIndex((p) => p.id === toId)
      if (fromIndex < 0 || toIndex < 0) return prev
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }

  const uploadPhotos = async (listingId: string): Promise<string[]> => {
    const uploadedUrls: string[] = []
    for (const item of photoItems) {
      if (item.uploaded) {
        uploadedUrls.push(item.url)
        continue
      }
      if (!item.file) continue

      const fileToUpload = await compressImage(item.file)
      const safeName = fileToUpload.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")
      const filePath = `${landlordId}/${listingId}/${Date.now()}-${safeName}`

      const timer = window.setInterval(() => {
        setPhotoItems((prev) =>
          prev.map((p) =>
            p.id === item.id ? { ...p, progress: Math.min(p.progress + 8, 92) } : p
          )
        )
      }, 120)

      const { error } = await supabase.storage
        .from("listings")
        .upload(filePath, fileToUpload, { upsert: false })
      window.clearInterval(timer)
      if (error) throw error

      const { data } = supabase.storage.from("listings").getPublicUrl(filePath)
      uploadedUrls.push(data.publicUrl)
      setPhotoItems((prev) =>
        prev.map((p) =>
          p.id === item.id ? { ...p, uploaded: true, progress: 100 } : p
        )
      )
    }
    return uploadedUrls
  }

  const onSubmit = async () => {
    const valid = await trigger()
    if (!valid) return
    if (photoItems.length === 0 && !videoUrl) {
      setMessage("Please upload at least one photo or a video of the property.")
      return
    }

    setSubmitting(true)
    setMessage(null)

    try {
      const values = getValues()
      const listingId = crypto.randomUUID()
      const photoUrls = await uploadPhotos(listingId)

      const payload = {
        id: listingId,
        landlord_id: landlordId,          // ← target user, NOT the admin
        title: values.title,
        university: values.university,
        description: values.description,
        room_type: values.room_type,
        price_yearly: values.price_yearly,
        distance_from_gate: values.distance_from_gate,
        address: values.address,
        area: values.area,
        landmark: values.landmark || null,
        amenities: values.amenities,
        photos: photoUrls,
        status: "pending",
        is_featured: false,
        whatsapp_number: values.whatsapp_number,
        phone_number: values.phone_number || null,
        available_from: values.available_from,
        occupancy: values.occupancy,
        furnishing: values.furnishing,
        floor: values.floor,
        agent_fee_type: isAgent ? agentFeeType : null,
        agent_fee_amount:
          isAgent && agentFeeType !== "none" && agentFeeAmount
            ? Number(agentFeeAmount)
            : null,
        video_url: videoUrl,
      }

      const { error: insertError } = await supabase.from("listings").insert(payload)
      if (insertError) throw insertError

      // Fire-and-forget: notify admins + audit log (server actions)
      void notifyAdminsNewListing(listingId)
      void logAdminActionClient({
        admin_id: adminId,
        action: "create_listing_on_behalf",
        target_type: "user",
        target_id: landlordId,
        details: {
          listing_id: listingId,
          listing_title: values.title,
          for_user: forUserName,
          admin_name: adminName,
        },
      })

      // SMS notification — fire to our API route (best-effort)
      if (forUserPhone) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://houseplug.ng"
        void fetch("/api/sms/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: forUserPhone,
            message: `Hi ${forUserName}, a new listing titled "${values.title}" has been created for your HousePlug account by our team. View it here: ${appUrl}/landlord/dashboard`,
          }),
        })
      }

      setComplete(true)
      router.refresh()
    } catch (err: any) {
      setMessage(err?.message ?? "Failed to create listing. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = useMemo(
    () => !submitting && (photoItems.length > 0 || !!videoUrl),
    [photoItems.length, submitting, videoUrl]
  )

  // ── Success screen ──────────────────────────────────────────────────────────
  if (complete) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center space-y-4">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
        <h2 className="text-lg font-bold text-emerald-900">
          Listing created for {forUserName}!
        </h2>
        <p className="text-sm text-emerald-700">
          The listing is now pending admin approval. {forUserPhone ? "An SMS has been sent to notify the user." : ""}
        </p>
        <div className="flex gap-3 justify-center">
          <a
            href="/admin/listings"
            className="inline-flex items-center gap-2 bg-[#1B4332] text-white rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-[#2D5A47] transition-colors"
          >
            Review Listings
          </a>
          <a
            href="/admin/users"
            className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 rounded-xl px-5 py-2.5 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Back to Users
          </a>
        </div>
      </div>
    )
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* Progress */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">Progress</p>
          <p className="text-sm text-gray-500">Step {currentStep + 1} of 4</p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full bg-[#1B4332] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ── Step 1: Basic Info ── */}
      {currentStep === 0 && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Step 1 — Basic Info</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
              <input
                {...register("title")}
                placeholder="e.g. Self-con in Choba near Gate"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
              />
              <p className="mt-1 text-xs text-gray-400">{titleLength}/80</p>
              {errors.title && (
                <p className="text-xs text-red-600 mt-0.5">{errors.title.message}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nearest university
              </label>
              <select
                {...register("university")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
              >
                <option value="">Which university is this property closest to?</option>
                {UNIVERSITIES.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              {errors.university && (
                <p className="text-xs text-red-600 mt-0.5">{errors.university.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Room Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Self-con", value: "self_con" },
                  { label: "1 Bedroom", value: "one_bedroom" },
                  { label: "2 Bedroom", value: "two_bedroom" },
                  { label: "Shared", value: "shared" },
                ].map((room) => (
                  <button
                    key={room.value}
                    type="button"
                    onClick={() =>
                      setValue("room_type", room.value as ListingFormValues["room_type"])
                    }
                    className={`rounded-lg border px-2 py-2 text-sm font-medium transition-colors ${
                      watch("room_type") === room.value
                        ? "border-[#1B4332] bg-[#1B4332] text-white"
                        : "border-gray-300 hover:border-[#1B4332]/40"
                    }`}
                  >
                    {room.label}
                  </button>
                ))}
              </div>
              {errors.room_type && (
                <p className="text-xs text-red-600 mt-0.5">{errors.room_type.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Yearly Price
              </label>
              <div className="flex items-center rounded-lg border border-gray-300 px-3 focus-within:ring-2 focus-within:ring-[#1B4332]/30">
                <span className="text-sm text-gray-500">₦</span>
                <input
                  type="number"
                  {...register("price_yearly", { valueAsNumber: true })}
                  className="w-full bg-transparent px-2 py-2 text-sm outline-none"
                />
              </div>
              {errors.price_yearly && (
                <p className="text-xs text-red-600 mt-0.5">{errors.price_yearly.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Distance from gate
              </label>
              <select
                {...register("distance_from_gate")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
              >
                <option value="under_5">Under 5 mins walk</option>
                <option value="5_to_15">5–15 mins walk</option>
                <option value="15_to_30">15–30 mins walk</option>
                <option value="above_30">30+ mins walk</option>
              </select>
              {errors.distance_from_gate && (
                <p className="text-xs text-red-600 mt-0.5">{errors.distance_from_gate.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Available from
              </label>
              <input
                type="date"
                {...register("available_from")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
              />
              {errors.available_from && (
                <p className="text-xs text-red-600 mt-0.5">{errors.available_from.message}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Step 2: Location ── */}
      {currentStep === 1 && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Step 2 — Location</h3>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Street / compound name
            </label>
            <input
              {...register("address")}
              placeholder="e.g. No 12, Scholar Street"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
            />
            {errors.address && (
              <p className="text-xs text-red-600 mt-0.5">{errors.address.message}</p>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Area</label>
              <input
                {...register("area")}
                placeholder="e.g. Choba, Rumuola, Nkpolu, Woji"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
              />
              {errors.area && (
                <p className="text-xs text-red-600 mt-0.5">{errors.area.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Landmark (optional)
              </label>
              <input
                {...register("landmark")}
                placeholder="e.g. Behind Choba park"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
              />
              {errors.landmark && (
                <p className="text-xs text-red-600 mt-0.5">{errors.landmark.message}</p>
              )}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                WhatsApp number
              </label>
              <input
                {...register("whatsapp_number")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
              />
              {errors.whatsapp_number && (
                <p className="text-xs text-red-600 mt-0.5">{errors.whatsapp_number.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Phone number (optional)
              </label>
              <input
                {...register("phone_number")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
              />
              {errors.phone_number && (
                <p className="text-xs text-red-600 mt-0.5">{errors.phone_number.message}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Step 3: Amenities & Details ── */}
      {currentStep === 2 && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Step 3 — Amenities & Details</h3>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Amenities</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {amenityOptions.map((amenity) => {
                const selected = amenities.includes(amenity)
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() =>
                      setValue(
                        "amenities",
                        selected
                          ? amenities.filter((a) => a !== amenity)
                          : [...amenities, amenity]
                      )
                    }
                    className={`rounded-lg border px-2 py-2 text-xs font-medium capitalize transition-colors ${
                      selected
                        ? "border-[#1B4332] bg-[#1B4332] text-white"
                        : "border-gray-300 hover:border-[#1B4332]/40"
                    }`}
                  >
                    {amenity.replace("_", " ")}
                  </button>
                )
              })}
            </div>
            {errors.amenities && (
              <p className="mt-1 text-xs text-red-600">{errors.amenities.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Occupancy (1–4 students)
              </label>
              <input
                type="number"
                min={1}
                max={4}
                {...register("occupancy", { valueAsNumber: true })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
              />
              {errors.occupancy && (
                <p className="text-xs text-red-600 mt-0.5">{errors.occupancy.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Furnishing</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Furnished", value: "furnished" },
                  { label: "Semi", value: "semi_furnished" },
                  { label: "Unfurnished", value: "unfurnished" },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() =>
                      setValue("furnishing", item.value as ListingFormValues["furnishing"])
                    }
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                      watch("furnishing") === item.value
                        ? "border-[#1B4332] bg-[#1B4332] text-white"
                        : "border-gray-300 hover:border-[#1B4332]/40"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {errors.furnishing && (
                <p className="text-xs text-red-600 mt-0.5">{errors.furnishing.message}</p>
              )}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Floor</label>
              <div className="flex gap-2">
                {[
                  { label: "Ground", value: "ground" },
                  { label: "Upper", value: "upper" },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() =>
                      setValue("floor", item.value as ListingFormValues["floor"])
                    }
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                      watch("floor") === item.value
                        ? "border-[#1B4332] bg-[#1B4332] text-white"
                        : "border-gray-300 hover:border-[#1B4332]/40"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {errors.floor && (
                <p className="text-xs text-red-600 mt-0.5">{errors.floor.message}</p>
              )}
            </div>
          </div>

          {/* Agent fee section */}
          {isAgent && (
            <div className="space-y-3 rounded-lg border border-gray-200 p-3">
              <label className="text-sm font-semibold text-gray-700">Agent Fee</label>
              <div className="grid grid-cols-3 gap-2">
                {(["none", "fixed", "negotiable"] as AgentFeeType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAgentFeeType(type)}
                    className={`rounded-lg border-2 py-2 text-sm capitalize font-medium transition-colors ${
                      agentFeeType === type
                        ? "border-[#1B4332] bg-[#1B4332]/5 text-[#1B4332]"
                        : "border-gray-200 text-gray-500"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              {(agentFeeType === "fixed" || agentFeeType === "negotiable") && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    {agentFeeType === "fixed" ? "Fee amount (₦)" : "Starting amount (₦)"}
                  </label>
                  <input
                    type="number"
                    value={agentFeeAmount}
                    onChange={(e) => setAgentFeeAmount(e.target.value)}
                    placeholder="e.g. 20000"
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
                  />
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <AiDescribeButton
                isPro={true} // admin always gets AI
                getPayload={() => {
                  const v = getValues()
                  return {
                    title: v.title,
                    room_type: v.room_type,
                    area: v.area,
                    university: v.university,
                    amenities: v.amenities,
                    distance_from_gate: v.distance_from_gate,
                    description: v.description,
                  }
                }}
                onApply={(text) => setValue("description", text, { shouldValidate: true })}
              />
            </div>
            <textarea
              {...register("description")}
              rows={5}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]/30"
              placeholder="Describe the room, compound, security, and proximity to campus..."
            />
            <div className="mt-1 flex justify-between">
              <p className="text-xs text-gray-400">{descriptionLength}/600 (min 10)</p>
              {errors.description && (
                <p className="text-xs text-red-600">{errors.description.message}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Step 4: Photos & Video ── */}
      {currentStep === 3 && (
        <section className="space-y-5">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Step 4 — Photos & Video</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Upload at least one photo or video. Video recommended for faster inquiries.
            </p>
          </div>

          {/* Video */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-gray-700">Property Video</label>
              <span className="rounded-full bg-[#F59E0B] px-2 py-0.5 text-xs font-medium text-white">
                Recommended
              </span>
            </div>
            <p className="text-xs text-gray-400">
              A short video tour gets 3× more inquiries. Max 30 seconds, up to 15MB. MP4 or MOV.
            </p>

            {!videoUrl && !videoUploading && (
              <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 p-6 cursor-pointer hover:border-[#1B4332] transition-colors">
                <Video className="w-6 h-6 text-gray-400" />
                <span className="text-sm font-medium text-gray-500">Click to upload video tour</span>
                <span className="text-[11px] text-gray-400 font-medium">
                  Max 30s · Under 15MB · Cloudinary Free optimization
                </span>
                <input
                  type="file"
                  accept="video/mp4,video/quicktime"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return

                    // 1. Client-side size & duration check
                    const validation = await validateVideoFile(file)
                    if (!validation.valid) {
                      setMessage(validation.error || "Invalid video file.")
                      return
                    }

                    setMessage(null)
                    setVideoUploading(true)

                    try {
                      // 2. Server-side quota & authorization verification
                      const authRes = await fetch("/api/media/cloudinary/validate-upload", { method: "POST" })
                      const authJson = await authRes.json()
                      if (!authRes.ok || !authJson.allowed) {
                        setMessage(authJson.error || "Video uploads are temporarily at capacity. Please upload photos instead.")
                        return
                      }

                      // 3. Upload to Cloudinary with optimized pipeline
                      const url = await uploadVideo(file)
                      setVideoUrl(url)
                    } catch (err) {
                      setMessage(
                        err instanceof Error
                          ? `Video upload failed: ${err.message}`
                          : "Video upload failed. Please try again."
                      )
                    } finally {
                      setVideoUploading(false)
                    }
                  }}
                />
              </label>
            )}

            {videoUploading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Validating &amp; uploading tour video...
              </div>
            )}

            {videoUrl && (
              <div className="relative rounded-xl overflow-hidden border border-gray-200">
                <video
                  src={getSafariCompatibleVideoUrl(videoUrl)}
                  controls
                  preload="none"
                  className="w-full max-h-64 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setVideoUrl(null)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Photos */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700">
              Photos
              <span className="ml-1 text-xs font-normal text-gray-400">
                (optional if video uploaded)
              </span>
            </label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-8 text-sm text-gray-500 hover:border-[#1B4332] hover:text-[#1B4332] transition-colors">
              <Upload className="h-4 w-4" />
              Upload photos (max 8)
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => onFilesSelected(e.target.files)}
              />
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {photoItems.map((photo, index) => (
                <div
                  key={photo.id}
                  draggable
                  onDragStart={() => setDraggedId(photo.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (draggedId) reorderPhotos(draggedId, photo.id)
                    setDraggedId(null)
                  }}
                  className="overflow-hidden rounded-lg border border-gray-200 bg-white"
                >
                  <div className="relative h-24">
                    <img
                      src={photo.url}
                      alt={`Photo ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      className="absolute right-1 top-1 rounded bg-black/60 p-1 text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {index === 0 && (
                      <span className="absolute left-1 top-1 rounded bg-[#F59E0B] px-1.5 py-0.5 text-[10px] font-semibold text-gray-900">
                        Cover
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1">
                    <GripVertical className="h-3 w-3 text-gray-400" />
                    <div className="h-1.5 flex-1 overflow-hidden rounded bg-gray-100">
                      <div
                        className="h-full bg-[#1B4332]"
                        style={{ width: `${photo.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Error message */}
      {message && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{message}</p>}

      {Object.keys(errors).length > 0 && (
        <p className="text-sm text-red-600">Please fix the highlighted fields before continuing.</p>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={prevStep}
          disabled={currentStep === 0}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >
          Previous
        </button>

        {currentStep < 3 ? (
          <button
            type="button"
            onClick={nextStep}
            className="rounded-lg bg-[#1B4332] px-5 py-2 text-sm font-semibold text-white hover:bg-[#2D5A47] transition-colors"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            disabled={!canSubmit}
            onClick={onSubmit}
            className="rounded-lg bg-[#1B4332] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-[#2D5A47] transition-colors flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Listing"
            )}
          </button>
        )}
      </div>
    </div>
  )
}
