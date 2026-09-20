"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { GraduationCap, Home, CreditCard, ChevronDown } from "lucide-react"
import { UNIVERSITIES, ROOM_TYPES } from "@/lib/constants"

export function HeroSearch() {
  const router = useRouter()
  const [university, setUniversity] = useState("")
  const [type, setType] = useState("")
  const [price, setPrice] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (university) params.append("university", university)
    if (type) params.append("type", type)
    if (price) params.append("price", price)
    
    router.push(`/browse?${params.toString()}`)
  }

  return (
    <form 
      onSubmit={handleSearch} 
      className="bg-white/95 backdrop-blur-md p-3 md:p-2 rounded-[2rem] md:rounded-full shadow-2xl shadow-primary/10 max-w-5xl mx-auto flex flex-col md:flex-row items-stretch md:items-center border border-white/40 mt-8 md:mt-12 w-full"
    >
      <div className="w-full md:w-1/3 flex items-center px-4 py-3.5 md:px-5 md:py-2 gap-3 border-b border-gray-100 md:border-b-0 md:border-r transition-colors focus-within:bg-gray-50/50 rounded-t-3xl md:rounded-none md:rounded-l-full relative">
        <div className="bg-primary/5 p-2.5 rounded-full shrink-0">
          <GraduationCap className="h-5 w-5 text-primary" />
        </div>
        <div className="text-left flex-1 min-w-0 pr-6">
          <span className="block text-[10px] sm:text-xs tracking-wider uppercase font-extrabold text-gray-500 mb-0.5">University</span>
          <select 
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            className="w-full border-none p-0 text-primary font-bold focus:ring-0 appearance-none bg-transparent text-sm sm:text-base outline-none cursor-pointer truncate"
          >
            <option value="">Select your university</option>
            {UNIVERSITIES.map((u) => (
              <option key={u.id} value={u.id}>{u.shortName}</option>
            ))}
          </select>
        </div>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
      
      <div className="w-full md:w-1/3 flex items-center px-4 py-3.5 md:px-5 md:py-2 gap-3 border-b border-gray-100 md:border-b-0 md:border-r transition-colors focus-within:bg-gray-50/50 relative">
        <div className="bg-primary/5 p-2.5 rounded-full shrink-0">
          <Home className="h-5 w-5 text-primary" />
        </div>
        <div className="text-left flex-1 min-w-0 pr-6">
          <span className="block text-[10px] sm:text-xs tracking-wider uppercase font-extrabold text-gray-500 mb-0.5">Room Type</span>
          <select 
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border-none p-0 text-primary font-bold focus:ring-0 appearance-none bg-transparent text-sm sm:text-base outline-none cursor-pointer truncate"
          >
            <option value="">All Types</option>
            {ROOM_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
      
      <div className="w-full md:w-1/3 flex items-center px-4 py-3.5 md:px-5 md:py-2 gap-3 transition-colors focus-within:bg-gray-50/50 md:rounded-r-full relative">
        <div className="bg-primary/5 p-2.5 rounded-full shrink-0">
          <CreditCard className="h-5 w-5 text-primary" />
        </div>
        <div className="text-left flex-1 min-w-0 pr-6">
          <span className="block text-[10px] sm:text-xs tracking-wider uppercase font-extrabold text-gray-500 mb-0.5">Price Range</span>
          <select 
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border-none p-0 text-primary font-bold focus:ring-0 appearance-none bg-transparent text-sm sm:text-base outline-none cursor-pointer truncate"
          >
            <option value="">Any Price</option>
            <option value="0-100000">₦0 – ₦100k</option>
            <option value="100000-200000">₦100k – ₦200k</option>
            <option value="200000-500000">₦200k – ₦500k</option>
            <option value="500000+">₦500k+</option>
          </select>
        </div>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
      
      <button 
        type="submit"
        className="w-full md:w-auto mt-3 md:mt-0 bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white font-bold text-base md:text-lg px-8 py-4 rounded-[1.5rem] md:rounded-full whitespace-nowrap transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98] md:ml-2 shrink-0"
      >
        Search Rooms
      </button>
    </form>
  )
}
