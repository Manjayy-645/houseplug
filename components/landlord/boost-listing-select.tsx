"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import { formatRoomType } from "@/lib/utils"

type BoostListing = {
  id: string
  title: string
  room_type: string
  area: string
}

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max) + "..." : str
}

export function BoostListingSelect({
  listings,
  selected,
  onSelect,
}: {
  listings: BoostListing[]
  selected: string | null
  onSelect: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open])

  const selectedListing = listings.find((l) => l.id === selected)

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm font-semibold text-gray-700 transition hover:border-gray-300 focus:border-[#1B4332] focus:outline-none"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`truncate ${selectedListing ? "text-gray-900" : "text-gray-400"}`}>
          {selectedListing ? truncate(selectedListing.title, 40) : "Select a listing..."}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
        >
          {listings.length === 0 ? (
            <p className="px-4 py-3 text-xs font-medium text-gray-400">
              No active listings to boost.
            </p>
          ) : (
            listings.map((listing) => {
              const isSelected = selected === listing.id
              return (
                <button
                  type="button"
                  key={listing.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onSelect(listing.id)
                    setOpen(false)
                  }}
                  className={`block w-full cursor-pointer border-b border-gray-50 px-4 py-3 text-left transition last:border-b-0 hover:bg-gray-50 ${
                    isSelected ? "bg-green-50 text-[#1B4332] font-medium" : ""
                  }`}
                >
                  <p className="truncate text-sm">{truncate(listing.title, 40)}</p>
                  <p className="text-xs text-gray-400">
                    {formatRoomType(listing.room_type)} · {listing.area}
                  </p>
                </button>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
