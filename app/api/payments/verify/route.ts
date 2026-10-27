import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyPaystackTransaction } from "@/lib/paystack"
import { processSuccessfulPayment } from "@/lib/billing"

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { reference } = (await request.json()) as { reference?: string }
  if (!reference) {
    return NextResponse.json({ error: "Payment reference is required" }, { status: 400 })
  }

  try {
    const transaction = await verifyPaystackTransaction(reference)

    if (transaction.status !== "success") {
      return NextResponse.json({ 
        error: transaction.gateway_response || "Payment verification failed" 
      }, { status: 400 })
    }

    // Process payment through the centralized, idempotent billing engine
    await processSuccessfulPayment(transaction)

    return NextResponse.json({ 
      success: true, 
      status: transaction.status,
      type: transaction.metadata?.type || "unknown" 
    })
  } catch (error: any) {
    console.error("[API_PAYMENTS_VERIFY] Error:", error)
    return NextResponse.json({ 
      error: error.message || "Failed to verify transaction" 
    }, { status: 500 })
  }
}
