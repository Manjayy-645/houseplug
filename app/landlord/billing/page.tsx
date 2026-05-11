'use client'
import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function BillingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const success = searchParams.get('success')
  const error = searchParams.get('error')

  useEffect(() => {
    // After successful payment, force router refresh so dashboard 
    // re-fetches subscription from DB
    if (success) {
      router.refresh()
    }
  }, [success, router])

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 p-6 text-center">
        <div className="text-6xl">🎉</div>
        <h1 className="text-2xl font-bold text-[#1B4332]">Payment Successful!</h1>
        <p className="text-gray-600">Your plan has been upgraded. Your listings are now featured.</p>
        
        <Link
          href="/landlord/dashboard"
          className="bg-[#1B4332] text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Go to Dashboard
        </Link>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 p-6 text-center">
        <div className="text-6xl">❌</div>
        <h1 className="text-2xl font-bold text-red-600">Payment Failed</h1>
        <p className="text-gray-600">
          {error === 'no_reference' && 'No payment reference found.'}
          {error === 'payment_failed' && 'Your payment was not completed.'}
          {error === 'server_error' && 'A server error occurred. Contact support.'}
          {!['no_reference', 'payment_failed', 'server_error'].includes(error) && 'An unknown error occurred.'}
        </p>
        
        <Link
          href="/landlord/subscription"
          className="bg-[#F59E0B] text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Try Again
        </Link>
      </div>
    )
  }

  // Redirect if accessed directly without params
  if (!success && !error && typeof window !== 'undefined') {
    router.push('/landlord/subscription')
  }

  return null
}
