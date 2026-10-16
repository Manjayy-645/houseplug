import type { ServiceCategory, ServicePricingType } from "@/types"

export const SERVICE_CATEGORIES: {
  id: ServiceCategory
  label: string
  shortLabel: string
  iconName: string
  color: string
}[] = [
  {
    id: "moving",
    label: "Keke & Van Moving",
    shortLabel: "Moving",
    iconName: "Truck",
    color: "from-blue-600 to-indigo-700",
  },
  {
    id: "cleaning",
    label: "Lodge Cleaning & Fumigation",
    shortLabel: "Cleaning",
    iconName: "Sparkles",
    color: "from-teal-600 to-emerald-700",
  },
  {
    id: "gas_refill",
    label: "Gas Refill & Delivery",
    shortLabel: "Gas Refill",
    iconName: "Flame",
    color: "from-amber-500 to-orange-600",
  },
  {
    id: "repairs",
    label: "Plumber / Electrician / Carpenter",
    shortLabel: "Repairs",
    iconName: "Wrench",
    color: "from-purple-600 to-indigo-800",
  },
  {
    id: "painting",
    label: "Painting & Room Decor",
    shortLabel: "Painting",
    iconName: "Paintbrush",
    color: "from-rose-500 to-pink-700",
  },
  {
    id: "laundry",
    label: "Laundry & Dry Cleaning",
    shortLabel: "Laundry",
    iconName: "Shirt",
    color: "from-cyan-600 to-blue-700",
  },
  {
    id: "other",
    label: "Other Campus Service",
    shortLabel: "Other",
    iconName: "HelpCircle",
    color: "from-gray-600 to-slate-800",
  },
]

export const SERVICE_UNIVERSITIES = [
  "University of Port Harcourt",
  "Rivers State University",
] as const

export const PRICE_UNIT_SUGGESTIONS = [
  "per trip",
  "per room",
  "per kg",
  "per load",
  "per job",
]

/**
 * Format flexible service pricing for cards, detail pages, and OG images.
 *
 * Rules:
 * - If pricing_type === 'negotiable' or !price_amount: "Negotiable (Contact for Quote)"
 * - If pricing_type === 'starting_from': "From ₦${Number(price_amount).toLocaleString('en-NG')}${price_unit ? ` / ${price_unit}` : ''}"
 * - If pricing_type === 'fixed': "₦${Number(price_amount).toLocaleString('en-NG')}${price_unit ? ` / ${price_unit}` : ''}"
 */
export function formatServicePrice(
  pricingType?: string | null,
  priceAmount?: number | null,
  priceUnit?: string | null
): string {
  if (pricingType === "negotiable" || !priceAmount || isNaN(Number(priceAmount))) {
    return "Negotiable (Contact for Quote)"
  }

  const cleanUnit = priceUnit ? priceUnit.trim().replace(/^\//, "").trim() : ""
  const unitSuffix = cleanUnit ? ` / ${cleanUnit}` : ""
  const formattedAmount = Number(priceAmount).toLocaleString("en-NG")

  if (pricingType === "starting_from") {
    return `From ₦${formattedAmount}${unitSuffix}`
  }

  if (pricingType === "fixed") {
    return `₦${formattedAmount}${unitSuffix}`
  }

  return "Negotiable (Contact for Quote)"
}

export function getCategoryLabel(categoryKey?: string | null): string {
  const match = SERVICE_CATEGORIES.find((c) => c.id === categoryKey)
  return match ? match.label : "Campus Service"
}

export function getCategoryShortLabel(categoryKey?: string | null): string {
  const match = SERVICE_CATEGORIES.find((c) => c.id === categoryKey)
  return match ? match.shortLabel : "Service"
}

export function formatNigerianPhoneForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/\D/g, "")
  if (cleaned.startsWith("0")) {
    cleaned = "234" + cleaned.slice(1)
  } else if (!cleaned.startsWith("234") && cleaned.length === 10) {
    cleaned = "234" + cleaned
  }
  return cleaned
}

export function buildServiceWhatsAppUrl(service: {
  id: string
  business_name: string
  whatsapp_number: string
}): string {
  const formattedPhone = formatNigerianPhoneForWhatsApp(service.whatsapp_number)
  const message = `Hi ${service.business_name}, I found your service on HousePlug (https://www.houseplug.ng/services/${service.id}) and would like to inquire...`
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
}
