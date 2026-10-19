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

/** Available icons for custom "Other" service categories */
export const CUSTOM_SERVICE_ICONS = [
  { id: 'Camera', label: 'Camera / Photography' },
  { id: 'Scissors', label: 'Scissors / Hair & Beauty' },
  { id: 'Palette', label: 'Palette / Art & Design' },
  { id: 'ShoppingBag', label: 'Shopping Bag / Delivery' },
  { id: 'Music', label: 'Music / DJ & Events' },
  { id: 'BookOpen', label: 'Book / Tutoring' },
  { id: 'Utensils', label: 'Utensils / Food & Catering' },
  { id: 'Wrench', label: 'Wrench / Handyman' },
  { id: 'Monitor', label: 'Monitor / Tech Services' },
  { id: 'Dumbbell', label: 'Dumbbell / Fitness' },
  { id: 'Briefcase', label: 'Briefcase / Professional' },
  { id: 'Heart', label: 'Heart / Health & Wellness' },
] as const

/** Available badge colors for custom "Other" service categories */
export const CUSTOM_SERVICE_COLORS = [
  { id: 'from-gray-600 to-slate-800', label: 'Slate', preview: 'bg-slate-600' },
  { id: 'from-rose-500 to-pink-700', label: 'Rose', preview: 'bg-rose-500' },
  { id: 'from-violet-500 to-purple-700', label: 'Violet', preview: 'bg-violet-500' },
  { id: 'from-sky-500 to-blue-700', label: 'Sky Blue', preview: 'bg-sky-500' },
  { id: 'from-emerald-500 to-green-700', label: 'Emerald', preview: 'bg-emerald-500' },
  { id: 'from-amber-500 to-orange-600', label: 'Amber', preview: 'bg-amber-500' },
  { id: 'from-red-500 to-rose-700', label: 'Red', preview: 'bg-red-500' },
  { id: 'from-teal-500 to-cyan-700', label: 'Teal', preview: 'bg-teal-500' },
] as const

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

export function getCategoryLabel(categoryKey?: string | null, customName?: string | null): string {
  if (categoryKey === 'other' && customName) {
    return customName
  }
  const match = SERVICE_CATEGORIES.find((c) => c.id === categoryKey)
  return match ? match.label : "Campus Service"
}

export function getCategoryShortLabel(categoryKey?: string | null, customName?: string | null): string {
  if (categoryKey === 'other' && customName) {
    return customName
  }
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
