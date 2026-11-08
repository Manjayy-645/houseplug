import type { Metadata } from 'next'
import Image from 'next/image'
import { Wrench, MessageCircle } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
  title: "Under Maintenance | HousePlug",
}

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-12">
        <Image src="/logo.png" alt="HousePlug Logo" width={64} height={64} className="rounded-2xl shadow-xl shadow-[#1B4332]/10" />
        <span className="text-3xl font-black text-[#1B4332]">HousePlug</span>
      </div>

      <div className="max-w-md space-y-6">
        <div className="flex justify-center">
          <div className="h-24 w-24 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 animate-pulse">
            <Wrench className="h-12 w-12" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">We'll be back soon</h1>
          <p className="text-gray-500 font-medium text-lg leading-relaxed">
            HousePlug is currently undergoing scheduled maintenance to improve our service. Check back in a few minutes.
          </p>
        </div>

        <div className="pt-8 flex flex-col items-center gap-4">
          <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Need urgent help?</p>
          <Link 
            href="https://wa.me/234XXXXXXXXXX" 
            target="_blank"
            className="flex items-center gap-2 bg-[#25D366] text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-green-500/20 hover:scale-105 active:scale-95 transition-all"
          >
            <MessageCircle className="h-5 w-5" />
            WhatsApp Support
          </Link>
        </div>
      </div>

      <footer className="mt-24">
        <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">&copy; {new Date().getFullYear()} HousePlug Nigeria</p>
      </footer>
    </div>
  )
}
