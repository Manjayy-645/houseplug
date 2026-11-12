"use client"

import { useMemo, useState, useId } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import * as Dialog from "@radix-ui/react-dialog"
import { SlidersHorizontal, X, RotateCcw } from "lucide-react"

import { ROOM_TYPES, DISTANCE_OPTIONS, AMENITIES } from "@/lib/constants"
import { UniversityCombobox } from "@/components/search/UniversityCombobox"

function SidebarContent({ mobile = false, onClose }: { mobile?: boolean; onClose?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = useId()
  const [university, setUniversity] = useState(searchParams.get("university") ?? "")
  const [roomTypes, setRoomTypes] = useState<string[]>(
    (searchParams.get("room_type") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  )
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
        ? "rounded-2xl border border-gray-100 bg-white p-5 shadow-xs"
        : "sticky top-20 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-xs",
    [mobile]
  )

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (university) params.set("university", university)
    else params.delete("university")

    if (roomTypes.length > 0) params.set("room_type", roomTypes.join(","))
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
    if (onClose) onClose()
  }

  const resetFilters = () => {
    setUniversity("")
    setRoomTypes([])
    setMinPrice("")
    setMaxPrice("")
    setDistance("")
    setVerifiedOnly(true)
    setAmenities([])
    router.push(pathname)
    if (onClose) onClose()
  }

  const toggleAmenity = (value: string) => {
    setAmenities((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    )
  }

  const toggleRoomType = (value: string) => {
    setRoomTypes((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    )
  }

  return (
    <aside className={boxClass}>
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 className="text-base font-extrabold text-[#1B4332]">Filters</h2>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-[#1B4332] transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
        </div>

        <section>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">
            University Campus
          </label>
          <div className="space-y-2">
            <UniversityCombobox 
              value={university}
              onChange={setUniversity}
              placeholder="All Campuses"
              className="w-full text-sm outline-none cursor-pointer p-2.5 border border-gray-200 rounded-xl focus:border-[#1B4332] bg-gray-50/50"
            />
          </div>
        </section>

        <section>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">
            Room Type
          </label>
          <div className="space-y-2.5">
            {ROOM_TYPES.map((option) => (
              <label 
                key={option.value} 
                className="flex items-center gap-2.5 text-sm font-medium text-gray-700 cursor-pointer hover:text-[#1B4332] transition-colors"
              >
                <input
                  type="checkbox"
                  checked={roomTypes.includes(option.value)}
                  onChange={() => toggleRoomType(option.value)}
                  className="h-4 w-4 rounded border-gray-300 text-[#1B4332] focus:ring-[#1B4332]"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </section>

        <section>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">
            Price Range (₦ / Year)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              placeholder="₦ Min"
              aria-label="Minimum price in Naira"
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm outline-none focus:border-[#1B4332] focus:bg-white transition-colors"
            />
            <input
              type="number"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder="₦ Max"
              aria-label="Maximum price in Naira"
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm outline-none focus:border-[#1B4332] focus:bg-white transition-colors"
            />
          </div>
        </section>

        <section>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">
            Distance from Gate
          </label>
          <div className="space-y-2">
            {DISTANCE_OPTIONS.map((option) => (
              <label 
                key={option.label} 
                className="flex items-center gap-2.5 text-sm font-medium text-gray-700 cursor-pointer hover:text-[#1B4332] transition-colors"
              >
                <input
                  type="radio"
                  name={`distance-${id}`}
                  value={option.value}
                  checked={distance === option.value}
                  onChange={(event) => setDistance(event.target.value)}
                  className="h-4 w-4 border-gray-300 text-[#1B4332] focus:ring-[#1B4332]"
                />
                <span>{option.label}</span>
              </label>
            ))}
            <label className="flex items-center gap-2.5 text-sm font-medium text-gray-700 cursor-pointer hover:text-[#1B4332] transition-colors">
              <input
                type="radio"
                name={`distance-${id}`}
                value=""
                checked={distance === ""}
                onChange={() => setDistance("")}
                className="h-4 w-4 border-gray-300 text-[#1B4332] focus:ring-[#1B4332]"
              />
              <span>Any distance</span>
            </label>
          </div>
        </section>

        <section>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">
            Trust &amp; Safety
          </label>
          <label className="flex items-center gap-2.5 text-sm font-medium text-gray-700 cursor-pointer hover:text-[#1B4332] transition-colors">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(event) => setVerifiedOnly(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#1B4332] focus:ring-[#1B4332]"
            />
            <span>Verified listings only</span>
          </label>
        </section>

        <section>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">
            Amenities
          </label>
          <div className="grid grid-cols-1 gap-2">
            {AMENITIES.map((option) => (
              <label 
                key={option.value} 
                className="flex items-center gap-2.5 text-sm font-medium text-gray-700 cursor-pointer hover:text-[#1B4332] transition-colors"
              >
                <input
                  type="checkbox"
                  checked={amenities.includes(option.value)}
                  onChange={() => toggleAmenity(option.value)}
                  className="h-4 w-4 rounded border-gray-300 text-[#1B4332] focus:ring-[#1B4332]"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </section>

        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={applyFilters}
            className="w-full rounded-xl bg-[#1B4332] hover:bg-[#153427] active:scale-[0.99] px-4 py-3 text-sm font-bold text-white shadow-sm transition-all"
          >
            Apply Filters
          </button>

          <button
            type="button"
            onClick={resetFilters}
            className="w-full text-center text-xs font-semibold text-gray-500 hover:text-gray-900 py-1.5 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      </div>
    </aside>
  )
}

export function FilterSidebar() {
  const [open, setOpen] = useState(false)
  const searchParams = useSearchParams()

  const activeCount = useMemo(() => {
    let count = 0
    if (searchParams.get("university")) count++
    if (searchParams.get("room_type")) count++
    if (searchParams.get("min_price") || searchParams.get("max_price")) count++
    if (searchParams.get("distance")) count++
    if (searchParams.get("amenities")) count++
    return count
  }, [searchParams])

  return (
    <>
      <div className="hidden lg:block w-72 shrink-0">
        <SidebarContent />
      </div>

      <div className="lg:hidden">
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-bold text-gray-800 shadow-2xs hover:bg-gray-50 active:scale-95 transition-all"
            >
              <SlidersHorizontal className="h-4 w-4 text-[#1B4332]" />
              <span>Filters</span>
              {activeCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1B4332] text-[10px] font-bold text-white">
                  {activeCount}
                </span>
              )}
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200" />
            <Dialog.Content className="fixed inset-y-0 right-0 z-50 w-[88%] max-w-sm overflow-y-auto bg-[#F9FAFB] p-5 shadow-2xl animate-in slide-in-from-right duration-200 pb-safe">
              <div className="mb-4 flex items-center justify-between">
                <Dialog.Title className="text-lg font-extrabold text-[#1B4332]">
                  Filters
                </Dialog.Title>
                <Dialog.Close asChild>
                  <button 
                    type="button" 
                    className="rounded-xl p-1.5 text-gray-500 hover:bg-gray-200 transition-colors"
                    aria-label="Close filters"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </Dialog.Close>
              </div>
              <SidebarContent mobile onClose={() => setOpen(false)} />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </>
  )
}
