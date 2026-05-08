const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!
const PAYSTACK_BASE = 'https://api.paystack.co'

export const PLAN_PRICES = {
  pro_monthly: 500000,      // ₦5,000 in kobo
  pro_annual: 4500000,      // ₦45,000 in kobo
  business_monthly: 1500000, // ₦15,000 in kobo
  business_annual: 12000000, // ₦120,000 in kobo
}

export const BOOST_PRICES = {
  featured_7: 150000,   // ₦1,500 in kobo
  featured_30: 400000,  // ₦4,000 in kobo
  urgent: 50000,        // ₦500 in kobo
  refresh: 30000,       // ₦300 in kobo
}

export const VERIFICATION_FEE = 200000 // ₦2,000 in kobo

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
