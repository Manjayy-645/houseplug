import { NextResponse } from 'next/server'
import { verifyPaystackTransaction } from '@/lib/paystack'
import { processSuccessfulPayment } from '@/lib/billing'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const reference = searchParams.get('reference') || searchParams.get('trxref')

  console.log('[CALLBACK] Reference received:', reference)

  const base = process.env.NEXT_PUBLIC_APP_URL || origin

  if (!reference) {
    console.error('[CALLBACK] No reference in URL')
    return NextResponse.redirect(`${base}/landlord/subscription?error=no_reference`)
  }

  try {
    const transaction = await verifyPaystackTransaction(reference)
    console.log('[CALLBACK] Transaction status:', transaction.status)
    console.log('[CALLBACK] Transaction metadata:', transaction.metadata)

    if (transaction.status === 'success') {
      await processSuccessfulPayment(transaction)
      console.log('[CALLBACK] processSuccessfulPayment completed')

      const type = transaction.metadata?.type
      if (type === 'verification') {
        return NextResponse.redirect(`${base}/landlord/verification?payment=success`)
      }
      if (type === 'boost') {
        return NextResponse.redirect(`${base}/landlord/subscription?boost=success`)
      }
      if (type === 'success_fee') {
        return NextResponse.redirect(`${base}/landlord/dashboard?success_fee=paid`)
      }
      if (type === 'service_listing' || type === 'service_boost') {
        return NextResponse.redirect(`${base}/services/manage?payment=success`)
      }
      return NextResponse.redirect(`${base}/landlord/subscription?payment=success`)
    }

    console.error('[CALLBACK] Payment not successful:', transaction.status)
    const failType = transaction.metadata?.type
    if (failType === 'verification') {
      return NextResponse.redirect(`${base}/landlord/verification?error=payment_failed`)
    }
    if (failType === 'success_fee') {
      return NextResponse.redirect(`${base}/landlord/dashboard?error=payment_failed`)
    }
    if (failType === 'service_listing' || failType === 'service_boost') {
      return NextResponse.redirect(`${base}/services/manage?error=payment_failed`)
    }
    return NextResponse.redirect(`${base}/landlord/subscription?error=payment_failed`)
  } catch (error) {
    console.error('[CALLBACK] Error:', error)
    // The payment itself may have succeeded (the webhook is the backup that
    // applies it). Never show a scary server error for a real payment.
    return NextResponse.redirect(`${base}/landlord/subscription?status=processing`)
  }
}
