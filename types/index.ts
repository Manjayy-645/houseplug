export type UserRole = "student" | "landlord" | "admin"

export type Profile = {
  id: string
  email: string
  full_name: string
  phone: string
  role: UserRole
  avatar_url?: string
  banned?: boolean
  created_at: string
}

export type RoomType = "self_con" | "one_bedroom" | "two_bedroom" | "shared"
export type DistanceFromGate = "under_5" | "5_to_15" | "15_to_30" | "above_30"
export type ListingStatus = "pending" | "active" | "rejected" | "inactive"
export type Plan = "free" | "pro" | "business"

export type BillingCycle = 'monthly' | 'annual'

export type BoostType = 'featured_7' | 'featured_30' | 'urgent' | 'refresh'

export type PaymentType = 'subscription' | 'boost' | 'verification'

export type Payment = {
  id: string
  landlord_id: string
  type: PaymentType
  plan?: Plan
  billing_cycle?: BillingCycle
  listing_id?: string
  boost_type?: BoostType
  amount: number
  paystack_reference: string
  status: 'pending' | 'success' | 'failed'
  created_at: string
}

export type ListingBoost = {
  id: string
  listing_id: string
  landlord_id: string
  boost_type: BoostType
  starts_at: string
  expires_at: string
  active: boolean
  created_at: string
}

export type Listing = {
  id: string
  landlord_id: string
  title: string
  description: string
  room_type: RoomType
  price_yearly: number
  distance_from_gate: DistanceFromGate
  address: string
  area: string
  landmark?: string
  amenities: string[]
  photos: string[]
  status: ListingStatus
  rejection_reason?: string
  is_featured: boolean
  is_urgent: boolean
  boost_expires_at?: string
  whatsapp_number: string
  phone_number?: string
  available_from?: string
  occupancy?: number
  furnishing?: "furnished" | "semi_furnished" | "unfurnished"
  floor?: "ground" | "upper"
  views_count: number
  whatsapp_clicks?: number
  created_at: string
  landlord?: Profile
  reviews?: Review[]
}

export type Review = {
  id: string
  listing_id: string
  student_id: string
  rating: number
  comment: string
  reply?: string
  created_at: string
  student?: Profile
}

export type Subscription = {
  id: string
  landlord_id: string
  plan: Plan
  billing_cycle: BillingCycle
  active: boolean
  amount_paid?: number
  paystack_reference?: string
  expires_at: string
  cancelled_at?: string
  created_at: string
}
