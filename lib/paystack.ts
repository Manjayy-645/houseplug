import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!
const PAYSTACK_BASE = 'https://api.paystack.co'

export async function getPlanPrices() {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
      'boost_refresh'
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
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, amount, metadata, callback_url }),
  })
  const data = await res.json()
  if (!data.status) throw new Error(data.message)
  return data.data as { authorization_url: string; reference: string; access_code: string }
}

export async function verifyPaystackTransaction(reference: string) {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  })
  const data = await res.json()
  if (!data.status) throw new Error(data.message)
  return data.data
}
