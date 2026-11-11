import { Calendar, Users, Home, ArrowUpCircle } from "lucide-react"
import { Listing } from "@/types"
import { formatDate } from "@/lib/utils"

type ListingDetailsGridProps = {
  listing: Listing
}

export function ListingDetailsGrid({ listing }: ListingDetailsGridProps) {
  const details = [
    {
      label: "Occupancy",
      value: listing.occupancy ? `${listing.occupancy} student(s)` : "Not confirmed",
      icon: Users
    },
    {
      label: "Furnishing",
      value: listing.furnishing ? listing.furnishing.replace("_", " ") : "Not confirmed",
      icon: Home
    },
    {
      label: "Floor",
      value: listing.floor ? listing.floor + " floor" : "Not confirmed",
      icon: ArrowUpCircle
    },
    {
      label: "Available From",
      value: listing.available_from && Date.parse(listing.available_from) > Date.now()
        ? `${formatDate(listing.available_from)} · confirm`
        : "Confirm with agent",
      icon: Calendar
    }
  ]

  return (
    <div className="grid grid-cols-2 gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      {details.map((detail) => (
        <div key={detail.label} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-[#1B4332]">
            <detail.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {detail.label}
            </p>
            <p className="text-sm font-semibold text-gray-900 capitalize">{detail.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
