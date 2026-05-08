"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, XCircle, ArrowRight, RefreshCcw } from "lucide-react"

export default function BillingResultPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const success = searchParams.get('success') === 'true'
  const error = searchParams.get('error') === 'true'

  if (!success && !error) {
    router.push('/landlord/subscription')
    return null
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full rounded-3xl border border-gray-100 bg-white p-8 shadow-xl">
        {success ? (
          <>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <h1 className="mb-2 text-2xl font-black text-gray-900">Payment Successful!</h1>
            <p className="mb-8 text-gray-600">
              Your plan has been updated and your listings have been boosted. Thank you for choosing HousePlug!
            </p>
            <Link
              href="/landlord/dashboard"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B4332] py-4 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition hover:brightness-110 active:scale-95"
            >
              Go to Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        ) : (
          <>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-500">
              <XCircle className="h-12 w-12" />
            </div>
            <h1 className="mb-2 text-2xl font-black text-gray-900">Payment Failed</h1>
            <p className="mb-8 text-gray-600">
              We couldn't process your payment. Please check your card details or try a different payment method.
            </p>
            <Link
              href="/landlord/subscription"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-4 text-sm font-bold text-white transition hover:bg-gray-800 active:scale-95"
            >
              <RefreshCcw className="h-4 w-4" /> Try Again
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
