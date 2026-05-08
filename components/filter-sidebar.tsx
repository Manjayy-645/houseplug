"use client"

import { useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import * as Dialog from "@radix-ui/react-dialog"
import { SlidersHorizontal, X } from "lucide-react"

const roomTypeOptions = [
  { label: "Self-con", value: "self_con" },
  { label: "1-Bedroom", value: "one_bedroom" },
  { label: "2-Bedroom", value: "two_bedroom" },
  { label: "Shared Room", value: "shared" }
]

const distanceOptions = [
  { label: "Under 5 mins", value: "under_5" },
  { label: "5-15 mins", value: "5_to_15" },
  { label: "15-30 mins", value: "15_to_30" },
  { label: "Any", value: "" }
]

const amenityOptions = [
  { label: "Running water", value: "running water" },
  { label: "24hr electricity / gen", value: "24hr electricity" },
  { label: "Security", value: "security" },
  { label: "Prepaid meter", value: "prepaid meter" },
  { label: "Parking", value: "parking" }
]

function SidebarContent({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [roomType, setRoomType] = useState(searchParams.get("room_type") ?? "")
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") ?? "")
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") ?? "")
  const [distance, setDistance] = useState(searchParams.get("distance") ?? "")
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get("verified") !== "0")
  const [amenities, setAmenities] = useState<string[]>(
    (searchParams.get("amenities") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  )

  const boxClass = useMemo(
    () =>
      mobile
        ? "rounded-xl border border-gray-200 bg-white p-4"
        : "sticky top-6 rounded-2xl border border-gray-200 bg-white p-4",
    [mobile]
  )

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (roomType) params.set("room_type", roomType)
    else params.delete("room_type")

    if (minPrice) params.set("min_price", minPrice)
    else params.delete("min_price")

    if (maxPrice) params.set("max_price", maxPrice)
    else params.delete("max_price")

    if (distance) params.set("distance", distance)
    else params.delete("distance")

    if (verifiedOnly) params.set("verified", "1")
    else params.set("verified", "0")

    if (amenities.length > 0) params.set("amenities", amenities.join(","))
    else params.delete("amenities")

    params.delete("page")
    router.push(`${pathname}?${params.toString()}`)
  }

  const resetFilters = () => {
    setRoomType("")
    setMinPrice("")
    setMaxPrice("")
    setDistance("")
    setVerifiedOnly(true)
    setAmenities([])
    router.push(pathname)
  }

  const toggleAmenity = (value: string) => {
    setAmenities((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    )
  }

  return (
    <aside className={boxClass}>
      <div className="space-y-5">
        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-700">Room Type</h3>
          <div className="space-y-2">
            {roomTypeOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={roomType === option.value}
                  onChange={() => setRoomType(roomType === option.value ? "" : option.value)}
                  className="h-4 w-4 rounded border-gray-300 text-[#1B4332] focus:ring-[#1B4332]"
                />
                {option.label}
              </label>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-700">Price Range</h3>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              placeholder="₦ min"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1B4332]"
            />
            <input
              type="number"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder="₦ max"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#1B4332]"
            />
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-700">
            Distance from Campus
          </h3>
          <div className="space-y-2">
            {distanceOptions.map((option) => (
              <label key={option.label} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name={`distance-${mobile ? "mobile" : "desktop"}`}
                  value={option.value}
                  checked={distance === option.value}
                  onChange={(event) => setDistance(event.target.value)}
                  className="h-4 w-4 border-gray-300 text-[#1B4332] focus:ring-[#1B4332]"
                />
                {option.label}
              </label>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-700">Verification</h3>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(event) => setVerifiedOnly(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#1B4332] focus:ring-[#1B4332]"
            />
            Verified listings only
          </label>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-700">Amenities</h3>
          <div className="space-y-2">
            {amenityOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={amenities.includes(option.value)}
                  onChange={() => toggleAmenity(option.value)}
                  className="h-4 w-4 rounded border-gray-300 text-[#1B4332] focus:ring-[#1B4332]"
                />
                {option.label}
              </label>
            ))}
          </div>
        </section>

        <button
          type="button"
          onClick={applyFilters}
          className="w-full rounded-lg bg-[#1B4332] px-4 py-2.5 text-sm font-semibold text-white"
        >
          Apply Filters
        </button>

        <button
          type="button"
          onClick={resetFilters}
          className="w-full text-sm font-medium text-gray-600 underline underline-offset-2"
        >
          Reset all filters
        </button>
      </div>
    </aside>
  )
}

export function FilterSidebar() {
  return (
    <>
      <div className="hidden lg:block">
        <SidebarContent />
      </div>

      <div className="lg:hidden">
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30" />
            <Dialog.Content className="fixed inset-y-0 right-0 z-50 w-[88%] max-w-sm overflow-y-auto bg-[#F9FAFB] p-4 shadow-2xl">
              <div className="mb-3 flex items-center justify-between">
                <Dialog.Title className="text-lg font-semibold text-gray-900">Filters</Dialog.Title>
                <Dialog.Close asChild>
                  <button type="button" className="rounded p-1 text-gray-700">
                    <X className="h-5 w-5" />
                  </button>
                </Dialog.Close>
              </div>
              <SidebarContent mobile />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </>
  )
}
