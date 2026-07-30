import { createHmac, timingSafeEqual } from 'crypto'
import { verifyPaystackTransaction } from '@/lib/paystack'
import { processSuccessfulPayment } from '@/lib/billing'

export async function POST(request: Request) {
  // 1. Read raw body as TEXT first — parsing as JSON would alter bytes
  //    and break the HMAC signature verification.
  const rawBody = await request.text()

  // 2. Get Paystack signature from header
  const paystackSignature = request.headers.get('x-paystack-signature')

  // 3. Reject requests without a signature header
  if (!paystackSignature) {
    console.error('[WEBHOOK] Missing x-paystack-signature header')
    return new Response('Unauthorized', { status: 401 })
  }

  // 4. Compute expected HMAC SHA512 signature
  const expectedSignature = createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
    .update(rawBody)
    .digest('hex')

  // 5. Timing-safe comparison to prevent timing attacks
  const sigBuffer = Buffer.from(paystackSignature, 'hex')
  const expectedBuffer = Buffer.from(expectedSignature, 'hex')

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    console.error('[WEBHOOK] Invalid signature — possible fake webhook attempt')
    return new Response('Unauthorized', { status: 401 })
  }

  // 6. Parse body AFTER signature verification passes
  const event = JSON.parse(rawBody)
  console.log('[WEBHOOK] Verified event:', event.event)

  if (event.event === 'charge.success') {
    const { reference } = event.data

    try {
      // 7. Double verification: confirm transaction with Paystack API
      //    Signature proves the request came from Paystack; this proves
      //    the payment actually succeeded (defence in depth).
      const verification = await verifyPaystackTransaction(reference)

      if (verification.status !== 'success') {
        console.error('[WEBHOOK] Paystack API verification failed for:', reference, verification.status)
        return new Response('Payment not verified', { status: 400 })
      }

      // 8. Process the verified payment
      await processSuccessfulPayment(verification)
      console.log('[WEBHOOK] Payment processed successfully:', reference)
    } catch (error) {
      console.error('[WEBHOOK] Error processing payment:', error)
      return new Response('Processing error', { status: 500 })
    }
  }

  return new Response('OK', { status: 200 })
}
