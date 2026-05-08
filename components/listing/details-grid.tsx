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
      value: `${listing.occupancy || 1} student(s)`,
      icon: Users
    },
    {
      label: "Furnishing",
      value: (listing.furnishing || "unfurnished").replace("_", " "),
      icon: Home
    },
    {
      label: "Floor",
      value: (listing.floor || "ground") + " floor",
      icon: ArrowUpCircle
    },
    {
      label: "Available From",
      value: listing.available_from ? formatDate(listing.available_from) : "Immediate",
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
