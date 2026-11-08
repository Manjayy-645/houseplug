import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Plug } from "lucide-react"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
}

type AuthLayoutProps = {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-[#F9FAFB] px-4 py-8 sm:py-12 flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        <div className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image src="/logo.png" alt="HousePlug Logo" width={48} height={48} className="rounded-xl" />
              <h1 className="text-3xl font-bold text-[#1B4332]">HousePlug</h1>
            </Link>
            <p className="mt-2 inline-flex items-center justify-center gap-1.5 text-sm text-gray-600">Your trusted housing plug <Plug className="h-4 w-4 text-[#1B4332]" /></p>
          </div>
          {children}
        </div>
      </div>
    </main>
  )
}
