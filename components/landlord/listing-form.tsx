"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { GripVertical, Upload, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { UNIVERSITIES } from "@/lib/constants"
import type { Listing } from "@/types"

const amenityOptions = [
  "water",
  "electricity",
  "security",
  "parking",
  "prepaid_meter",
  "kitchen",
  "bathroom",
  "wifi"
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
    .refine((value) => !value || /^(070|080|081|090)\d{8}$/.test(value), "Invalid phone number"),
  amenities: z.array(z.string()).min(1, "Select at least one amenity"),
  occupancy: z.number().min(1).max(4),
  furnishing: z.enum(["furnished", "semi_furnished", "unfurnished"]),
  floor: z.enum(["ground", "upper"]),
  description: z.string().min(80, "Description must be at least 80 characters").max(600)
})

type ListingFormValues = z.infer<typeof listingSchema>

type PhotoItem = {
  id: string
  file?: File
  url: string
  uploaded: boolean
  progress: number
}

type ListingFormProps = {
  mode: "create" | "edit"
  listing?: Listing
  landlordId: string
  isPro: boolean
}

const stepFields: Array<Array<keyof ListingFormValues>> = [
  ["title", "university", "room_type", "price_yearly", "distance_from_gate", "available_from"],
  ["address", "area", "landmark", "whatsapp_number", "phone_number"],
  ["amenities", "occupancy", "furnishing", "floor", "description"],
  []
]

export function ListingForm({ mode, listing, landlordId, isPro }: ListingFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const draftKey = mode === "create" ? "houseplug-listing-draft-new" : `houseplug-listing-draft-${listing?.id}`

  const [currentStep, setCurrentStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [photoItems, setPhotoItems] = useState<PhotoItem[]>(
    (listing?.photos ?? []).map((url, index) => ({
      id: `existing-${index}`,
      url,
      uploaded: true,
      progress: 100
    }))
  )
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [complete, setComplete] = useState(false)

  const defaultValues: ListingFormValues = {
    title: listing?.title ?? "",
    university: listing?.university ?? "uniport",
    room_type: listing?.room_type ?? "self_con",
    price_yearly: listing?.price_yearly ?? 0,
    distance_from_gate: listing?.distance_from_gate ?? "under_5",
    available_from: listing?.available_from?.split('T')[0] ?? "",
    address: listing?.address ?? "",
    area: listing?.area ?? "",
    landmark: listing?.landmark ?? "",
    whatsapp_number: listing?.whatsapp_number ?? "",
    phone_number: listing?.phone_number ?? "",
    amenities: listing?.amenities ?? [],
    occupancy: listing?.occupancy ?? 1,
    furnishing: listing?.furnishing ?? "unfurnished",
    floor: listing?.floor ?? "ground",
    description: listing?.description ?? ""
  }

  const {
    register,
    watch,
    setValue,
    getValues,
    formState: { errors },
    trigger
  } = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues
  })

  useEffect(() => {
    if (mode !== "create") return
    const raw = window.localStorage.getItem(draftKey)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as Partial<ListingFormValues>
      for (const [key, value] of Object.entries(parsed)) {
        setValue(key as keyof ListingFormValues, value as never)
      }
    } catch {
      // Ignore invalid draft data.
    }
  }, [draftKey, mode, setValue])

  useEffect(() => {
    const subscription = watch((values) => {
      window.localStorage.setItem(draftKey, JSON.stringify(values))
    })
    return () => subscription.unsubscribe()
  }, [draftKey, watch])

  const titleLength = watch("title")?.length ?? 0
  const descriptionLength = watch("description")?.length ?? 0
  const progress = ((currentStep + 1) / 4) * 100

  const nextStep = async () => {
    const valid = await trigger(stepFields[currentStep])
    if (!valid) return
    setCurrentStep((step) => Math.min(step + 1, 3))
  }

  const prevStep = () => setCurrentStep((step) => Math.max(step - 1, 0))

  const onFilesSelected = (files: FileList | null) => {
    if (!files) return
    const selected = Array.from(files).slice(0, Math.max(0, 8 - photoItems.length))
    const mapped: PhotoItem[] = selected.map((file) => ({
      id: `new-${crypto.randomUUID()}`,
      file,
      url: URL.createObjectURL(file),
      uploaded: false,
      progress: 0
    }))
    setPhotoItems((prev) => [...prev, ...mapped])
  }

  const removePhoto = (id: string) => {
    setPhotoItems((prev) => prev.filter((photo) => photo.id !== id))
  }

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

  const uploadPhotos = async (listingId: string) => {
    const uploadedUrls: string[] = []
    for (const item of photoItems) {
      if (item.uploaded) {
        uploadedUrls.push(item.url)
        continue
      }
      if (!item.file || !landlordId) continue
      
      const safeName = item.file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
      const filePath = `${landlordId}/${listingId}/${Date.now()}-${safeName}`

      const timer = window.setInterval(() => {
        setPhotoItems((prev) =>
          prev.map((photo) =>
            photo.id === item.id ? { ...photo, progress: Math.min(photo.progress + 8, 92) } : photo
          )
        )
      }, 120)

      const { error } = await supabase.storage.from("listings").upload(filePath, item.file, {
        upsert: false
      })
      window.clearInterval(timer)
      if (error) throw error

      const { data } = supabase.storage.from("listings").getPublicUrl(filePath)
      uploadedUrls.push(data.publicUrl)
      setPhotoItems((prev) =>
        prev.map((photo) => (photo.id === item.id ? { ...photo, uploaded: true, progress: 100 } : photo))
      )
    }

    return uploadedUrls
  }

  const onSubmit = async () => {
    const valid = await trigger()
    if (!valid) return
    if (photoItems.length === 0) {
      setMessage("Add at least one photo before submitting.")
      return
    }
    if (!landlordId) {
      setMessage("Could not determine landlord account. Please re-login.")
      return
    }

    setSubmitting(true)
    setMessage(null)

    try {
      const values = getValues()
      const listingId = listing?.id ?? crypto.randomUUID()
      const photoUrls = await uploadPhotos(listingId)

      const payload = {
        id: listingId,
        landlord_id: landlordId,
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
        is_featured: isPro,
        whatsapp_number: values.whatsapp_number,
        phone_number: values.phone_number || null,
        available_from: values.available_from,
        occupancy: values.occupancy,
        furnishing: values.furnishing,
        floor: values.floor
      }

      if (mode === "edit" && listing?.id) {
        const { error } = await supabase.from("listings").update(payload).eq("id", listing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("listings").insert(payload)
        if (error) throw error
      }

      window.localStorage.removeItem(draftKey)
      setComplete(true)
      router.refresh()
    } catch (error: any) {
      setMessage(error?.message ?? "Failed to save listing.")
    } finally {
      setSubmitting(false)
    }
  }

  const amenities = watch("amenities")
  const canSubmit = useMemo(() => !submitting && photoItems.length > 0, [photoItems.length, submitting])

  if (complete) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <h2 className="text-lg font-semibold text-emerald-900">
          Submitted for verification. We&apos;ll review within 24 hours.
        </h2>
        <button
          type="button"
          onClick={() => router.push("/landlord/dashboard")}
          className="mt-4 rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-semibold text-white"
        >
          View My Listings
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:p-6">
      {mode === "edit" ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Editing requires re-verification before going live.
        </div>
      ) : null}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-700">Progress</p>
          <p className="text-sm text-gray-600">
            Step {currentStep + 1} of 4
          </p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full bg-[#1B4332]" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {currentStep === 0 ? (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Step 1 - Basic Info</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Title</label>
              <input {...register("title")} placeholder="e.g. Self-con in Choba near Gate" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              <p className="mt-1 text-xs text-gray-500">{titleLength}/80</p>
              {errors.title ? <p className="text-xs text-red-600">{errors.title.message}</p> : null}
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Nearest university</label>
              <select 
                {...register("university")} 
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
              >
                <option value="">Which university is this property closest to?</option>
                {UNIVERSITIES.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              {errors.university ? <p className="text-xs text-red-600">{errors.university.message}</p> : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Room Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Self-con", value: "self_con" },
                  { label: "1 Bedroom", value: "one_bedroom" },
                  { label: "2 Bedroom", value: "two_bedroom" },
                  { label: "Shared", value: "shared" }
                ].map((room) => (
                  <button
                    key={room.value}
                    type="button"
                    onClick={() => setValue("room_type", room.value as ListingFormValues["room_type"])}
                    className={`rounded-lg border px-2 py-2 text-sm ${
                      watch("room_type") === room.value
                        ? "border-[#1B4332] bg-[#1B4332] text-white"
                        : "border-gray-300"
                    }`}
                  >
                    {room.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Yearly Price</label>
              <div className="flex items-center rounded-lg border border-gray-300 px-3">
                <span className="text-sm text-gray-600">₦</span>
                <input
                  type="number"
                  {...register("price_yearly", { valueAsNumber: true })}
                  className="w-full bg-transparent px-2 py-2 text-sm outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Distance from gate</label>
              <select {...register("distance_from_gate")} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="under_5">Under 5 mins walk</option>
                <option value="5_to_15">5-15 mins walk</option>
                <option value="15_to_30">15-30 mins walk</option>
                <option value="above_30">30+ mins walk</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Available from</label>
              <input type="date" {...register("available_from")} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>
        </section>
      ) : null}

      {currentStep === 1 ? (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Step 2 - Location</h3>
          <div>
            <label className="mb-1 block text-sm font-medium">Street / compound name</label>
            <input {...register("address")} placeholder="e.g. No 12, Scholar Street" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Area</label>
              <input 
                {...register("area")} 
                placeholder="e.g. Choba, Rumuola, Nkpolu, Woji" 
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" 
              />
              <p className="mt-1 text-[10px] text-gray-500 font-medium italic">Enter the area/neighbourhood your property is in</p>
              {errors.area ? <p className="text-xs text-red-600">{errors.area.message}</p> : null}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Landmark (optional)</label>
              <input
                {...register("landmark")}
                placeholder="e.g. Behind Choba park"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">WhatsApp number</label>
              <input {...register("whatsapp_number")} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Phone number (optional)</label>
              <input {...register("phone_number")} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>
        </section>
      ) : null}

      {currentStep === 2 ? (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Step 3 - Amenities & Details</h3>
          <div>
            <p className="mb-2 text-sm font-medium">Amenities</p>
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
                        selected ? amenities.filter((item) => item !== amenity) : [...amenities, amenity]
                      )
                    }
                    className={`rounded-lg border px-2 py-2 text-xs ${
                      selected ? "border-[#1B4332] bg-[#1B4332] text-white" : "border-gray-300"
                    }`}
                  >
                    {amenity.replace("_", " ")}
                  </button>
                )
              })}
            </div>
            {errors.amenities ? <p className="mt-1 text-xs text-red-600">{errors.amenities.message}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Occupancy (1-4 students)</label>
              <input
                type="number"
                min={1}
                max={4}
                {...register("occupancy", { valueAsNumber: true })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1B4332]"
              />
              {errors.occupancy ? <p className="mt-1 text-xs text-red-600">{errors.occupancy.message}</p> : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Furnishing</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Furnished", value: "furnished" },
                  { label: "Semi", value: "semi_furnished" },
                  { label: "Unfurnished", value: "unfurnished" }
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setValue("furnishing", item.value as ListingFormValues["furnishing"])}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                      watch("furnishing") === item.value
                        ? "border-[#1B4332] bg-[#1B4332] text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:border-[#1B4332]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {errors.furnishing ? <p className="mt-1 text-xs text-red-600">{errors.furnishing.message}</p> : null}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Floor</label>
              <div className="flex gap-2">
                {[
                  { label: "Ground", value: "ground" },
                  { label: "Upper", value: "upper" }
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setValue("floor", item.value as ListingFormValues["floor"])}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                      watch("floor") === item.value
                        ? "border-[#1B4332] bg-[#1B4332] text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:border-[#1B4332]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {errors.floor ? <p className="mt-1 text-xs text-red-600">{errors.floor.message}</p> : null}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea 
              {...register("description")} 
              rows={4} 
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm md:rows-6" 
              placeholder="Describe the room, compound, security, and proximity to campus..."
            />
            <div className="mt-1 flex justify-between">
              <p className="text-xs text-gray-500">{descriptionLength}/600 (min 80)</p>
              {errors.description ? <p className="text-xs text-red-600">{errors.description.message}</p> : null}
            </div>
          </div>
        </section>
      ) : null}

      {currentStep === 3 ? (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Step 4 - Photos</h3>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-8 text-sm text-gray-600">
            <Upload className="h-4 w-4" />
            Upload photos (max 8)
            <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => onFilesSelected(event.target.files)} />
          </label>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {photoItems.map((photo, index) => (
              <div
                key={photo.id}
                draggable
                onDragStart={() => setDraggedId(photo.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (draggedId) reorderPhotos(draggedId, photo.id)
                  setDraggedId(null)
                }}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white"
              >
                <div className="relative h-24">
                  <img src={photo.url} alt={`Photo ${index + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    className="absolute right-1 top-1 rounded bg-black/60 p-1 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {index === 0 ? (
                    <span className="absolute left-1 top-1 rounded bg-[#F59E0B] px-1.5 py-0.5 text-[10px] font-semibold text-gray-900">
                      Cover
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-1 px-2 py-1">
                  <GripVertical className="h-3 w-3 text-gray-400" />
                  <div className="h-1.5 flex-1 overflow-hidden rounded bg-gray-100">
                    <div className="h-full bg-[#1B4332]" style={{ width: `${photo.progress}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {message ? <p className="text-sm text-red-600">{message}</p> : null}

      {Object.keys(errors).length ? (
        <p className="text-sm text-red-600">Please fix the highlighted fields before continuing.</p>
      ) : null}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prevStep}
          disabled={currentStep === 0}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
        >
          Previous
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              window.localStorage.setItem(draftKey, JSON.stringify(getValues()))
              setMessage("Draft saved locally.")
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            Save as draft
          </button>
          {currentStep < 3 ? (
            <button type="button" onClick={nextStep} className="rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-semibold text-white">
              Continue
            </button>
          ) : (
            <button
              type="button"
              disabled={!canSubmit}
              onClick={onSubmit}
              className="rounded-lg bg-[#1B4332] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "Submitting..." : mode === "edit" ? "Save Changes" : "Submit Listing"}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

