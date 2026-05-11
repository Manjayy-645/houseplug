import { NextResponse } from 'next/server'
import { verifyPaystackTransaction } from '@/lib/paystack'
import { processSuccessfulPayment } from '@/lib/billing'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get('reference')

  console.log('[CALLBACK] Reference received:', reference)

  if (!reference) {
    console.error('[CALLBACK] No reference in URL')
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/landlord/billing?error=no_reference`
    )
  }

  try {
    const transaction = await verifyPaystackTransaction(reference)
    console.log('[CALLBACK] Transaction status:', transaction.status)
    console.log('[CALLBACK] Transaction metadata:', transaction.metadata)

    if (transaction.status === 'success') {
      await processSuccessfulPayment(transaction)
      console.log('[CALLBACK] processSuccessfulPayment completed')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/landlord/billing?success=true`
      )
    }

    console.error('[CALLBACK] Payment not successful:', transaction.status)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/landlord/billing?error=payment_failed`
    )
  } catch (error) {
    console.error('[CALLBACK] Error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/landlord/billing?error=server_error`
    )
  }
}
