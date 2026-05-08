import { Bath, Car, Droplets, ShieldCheck, UtensilsCrossed, Wifi, Zap, X } from "lucide-react"
import type { ComponentType } from "react"

type AmenitiesGridProps = {
  amenities: string[]
}

type AmenityKey =
  | "water"
  | "electricity"
  | "security"
  | "parking"
  | "prepaid_meter"
  | "kitchen"
  | "bathroom"
  | "wifi"

const amenityMeta: Record<AmenityKey, { label: string; icon: ComponentType<any> }> = {
  water: { label: "Running water", icon: Droplets },
  electricity: { label: "24hr electricity / gen", icon: Zap },
  security: { label: "Security / gateman", icon: ShieldCheck },
  parking: { label: "Parking space", icon: Car },
  prepaid_meter: { label: "Prepaid meter", icon: Zap },
  kitchen: { label: "Private kitchen", icon: UtensilsCrossed },
  bathroom: { label: "En-suite bathroom", icon: Bath },
  wifi: { label: "Wi-Fi", icon: Wifi }
}

const specialKeys: AmenityKey[] = ["water", "electricity", "security"]

export default function AmenitiesGrid({ amenities }: AmenitiesGridProps) {
  const amenitySet = new Set((amenities ?? []).map((a) => a.toLowerCase().trim()))

  const keysToRender: AmenityKey[] = [
    "water",
    "electricity",
    "security",
    "parking",
    "prepaid_meter",
    "kitchen",
    "bathroom",
    "wifi"
  ]

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-gray-900">Amenities</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {keysToRender.map((key) => {
          const meta = amenityMeta[key]
          const present = amenitySet.has(key)
          const Icon = meta.icon

          if (!present && !specialKeys.includes(key)) return null

          const specialMissing = !present && specialKeys.includes(key)

          return (
            <div
              key={key}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${
                present && !specialMissing
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-gray-200 bg-gray-100 text-gray-500"
              }`}
            >
              {present ? <Icon className="h-4 w-4 text-[#1B4332]" /> : <X className="h-4 w-4" />}
              <span>{meta.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

