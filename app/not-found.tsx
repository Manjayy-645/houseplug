import Link from "next/link"
import { Home, Search, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 bg-[#1B4332]/10 rounded-full flex items-center justify-center mb-6">
          <Home className="w-10 h-10 text-[#1B4332]" />
        </div>

        {/* Text */}
        <h1 className="text-3xl font-bold text-[#111827] mb-2">Page not found</h1>
        <p className="text-gray-500 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1B4332] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1B4332]/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <Link
            href="/browse"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-[#111827] hover:bg-gray-50 transition-colors"
          >
            <Search className="w-4 h-4" />
            Browse Listings
          </Link>
        </div>

        <p className="mt-8 text-xs text-gray-400">
          If you think this is an error, please{" "}
          <Link href="/contact" className="underline text-[#1B4332]">
            contact us
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
