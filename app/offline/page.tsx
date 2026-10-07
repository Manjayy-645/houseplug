"use client"

import { WifiOff } from "lucide-react"

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-sm w-full flex flex-col items-center">
        <div className="h-24 w-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <WifiOff size={48} color="#1B4332" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-3">You're offline</h1>
        <p className="text-[#1B4332] text-sm mb-8 leading-relaxed">
          You're currently offline. Check your internet connection to view verified lodges and active listings.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-[#1B4332] text-white py-3.5 rounded-xl font-bold hover:bg-[#143326] transition active:scale-95"
        >
          Try Reloading
        </button>
      </div>
    </div>
  )
}
