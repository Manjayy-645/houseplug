import { headers } from 'next/headers'
import crypto from 'crypto'
import { processSuccessfulPayment } from '@/lib/billing'

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = headers()

  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(body)
    .digest('hex')

  const paystackSignature = headersList.get('x-paystack-signature')

  console.log('[WEBHOOK] Signature match:', hash === paystackSignature)

  if (hash !== paystackSignature) {
    return new Response('Invalid signature', { status: 401 })
  }

  const event = JSON.parse(body)
  console.log('[WEBHOOK] Event type:', event.event)

  if (event.event === 'charge.success') {
    try {
      await processSuccessfulPayment(event.data)
      console.log('[WEBHOOK] Payment processed successfully')
    } catch (error) {
      console.error('[WEBHOOK] Error processing payment:', error)
      return new Response('Processing error', { status: 500 })
    }
  }

  return new Response('OK', { status: 200 })
}
