import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyPaystackTransaction } from "@/lib/paystack"
import { processSuccessfulPayment } from "@/lib/billing"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get('reference')

  if (!reference) {
    return NextResponse.redirect(new URL('/landlord/billing?error=true', request.url))
  }

  try {
    const transaction = await verifyPaystackTransaction(reference)

    if (transaction.status === 'success') {
      try {
        await processSuccessfulPayment(transaction)
        return NextResponse.redirect(new URL('/landlord/billing?success=true', request.url))
      } catch (err) {
        console.error('processSuccessfulPayment failed:', err)
        return NextResponse.redirect(new URL('/landlord/billing?error=true', request.url))
      }
    } else {
      const supabase = createClient()
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('paystack_reference', reference)
      
      return NextResponse.redirect(new URL('/landlord/billing?error=true', request.url))
    }
  } catch (error) {
    console.error('Payment callback error:', error)
    return NextResponse.redirect(new URL('/landlord/billing?error=true', request.url))
  }
}
