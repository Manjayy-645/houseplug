import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const PAYSTACK_BASE = 'https://api.paystack.co'

function getPaystackSecret(): string {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured in environment variables')
  }
  return secret
}

export async function getPlanPrices() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return {
      pro_monthly: 500000,
      pro_annual: 4500000,
      business_monthly: 1500000,
      business_annual: 13500000,
      verification: 200000,
      featured_7: 150000,
      featured_30: 400000,
      urgent: 50000,
      refresh: 30000,
      service_listing: 300000,
    }
  }

  const supabase = createSupabaseClient(
    supabaseUrl,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data } = await supabase
    .from('platform_settings')
    .select('key, value')
    .in('key', [
      'pro_plan_price',
      'business_plan_price',
      'verification_fee',
      'boost_featured_7',
      'boost_featured_30',
      'boost_urgent',
      'boost_refresh',
      'service_listing_price'
    ])

  const settings = Object.fromEntries(
    data?.map(s => [s.key, Number(s.value)]) ?? []
  )

  return {
    pro_monthly: settings.pro_plan_price ?? 500000,
    pro_annual: Math.round((settings.pro_plan_price ?? 500000) * 9),
    business_monthly: settings.business_plan_price ?? 1500000,
    business_annual: Math.round((settings.business_plan_price ?? 1500000) * 9),
    verification: settings.verification_fee ?? 200000,
    featured_7: settings.boost_featured_7 ?? 150000,
    featured_30: settings.boost_featured_30 ?? 400000,
    urgent: settings.boost_urgent ?? 50000,
    refresh: settings.boost_refresh ?? 30000,
    service_listing: settings.service_listing_price ?? 300000,
  }
}

export async function initializePaystackTransaction({
  email,
  amount,
  metadata,
  callback_url,
}: {
  email: string
  amount: number
  metadata: Record<string, any>
  callback_url: string
}) {
  const secret = getPaystackSecret()
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, amount, metadata, callback_url }),
  })
  const data = await res.json()
  if (!res.ok || !data.status) {
    throw new Error(data.message || `Paystack initialize failed (status: ${res.status})`)
  }
  return data.data as { authorization_url: string; reference: string; access_code: string }
}

export async function verifyPaystackTransaction(reference: string) {
  const secret = getPaystackSecret()
  const cleanRef = encodeURIComponent(reference.trim())
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${cleanRef}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${secret}` },
    cache: 'no-store',
  })
  const data = await res.json()
  if (!res.ok || !data.status) {
    throw new Error(data.message || `Paystack verification failed (status: ${res.status})`)
  }
  return data.data
}
