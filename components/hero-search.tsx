"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { GraduationCap, Home, CreditCard } from "lucide-react"
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
      className="bg-white/95 backdrop-blur-md p-3 md:p-2 rounded-[2rem] md:rounded-full shadow-2xl shadow-primary/10 max-w-5xl mx-auto flex flex-col md:flex-row items-stretch md:items-center border border-white/40 mt-10 md:mt-12"
    >
      <div className="w-full md:w-1/3 flex items-center px-5 py-4 md:py-2 gap-4 border-b border-gray-100 md:border-b-0 md:border-r transition-colors focus-within:bg-gray-50/50 rounded-t-3xl md:rounded-none md:rounded-l-full">
        <div className="bg-primary/5 p-2.5 rounded-full">
          <GraduationCap className="h-5 w-5 text-primary" />
        </div>
        <div className="text-left w-full flex-1">
          <span className="block text-[10px] tracking-wider uppercase font-extrabold text-gray-500 mb-0.5">University</span>
          <select 
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            className="w-full border-none p-0 text-primary font-bold focus:ring-0 appearance-none bg-transparent text-sm md:text-base outline-none cursor-pointer"
          >
            <option value="">Select your university</option>
            {UNIVERSITIES.map((u) => (
              <option key={u.id} value={u.id}>{u.shortName}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="w-full md:w-1/3 flex items-center px-5 py-4 md:py-2 gap-4 border-b border-gray-100 md:border-b-0 md:border-r transition-colors focus-within:bg-gray-50/50">
        <div className="bg-primary/5 p-2.5 rounded-full">
          <Home className="h-5 w-5 text-primary" />
        </div>
        <div className="text-left w-full flex-1">
          <span className="block text-[10px] tracking-wider uppercase font-extrabold text-gray-500 mb-0.5">Room Type</span>
          <select 
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border-none p-0 text-primary font-bold focus:ring-0 appearance-none bg-transparent text-sm md:text-base outline-none cursor-pointer"
          >
            <option value="">All Types</option>
            {ROOM_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="w-full md:w-1/3 flex items-center px-5 py-4 md:py-2 gap-4 transition-colors focus-within:bg-gray-50/50 md:rounded-r-full">
        <div className="bg-primary/5 p-2.5 rounded-full">
          <CreditCard className="h-5 w-5 text-primary" />
        </div>
        <div className="text-left w-full flex-1">
          <span className="block text-[10px] tracking-wider uppercase font-extrabold text-gray-500 mb-0.5">Price Range</span>
          <select 
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border-none p-0 text-primary font-bold focus:ring-0 appearance-none bg-transparent text-sm md:text-base outline-none cursor-pointer"
          >
            <option value="">Any Price</option>
            <option value="0-100000">₦0 – ₦100k</option>
            <option value="100000-200000">₦100k – ₦200k</option>
            <option value="200000-500000">₦200k – ₦500k</option>
            <option value="500000+">₦500k+</option>
          </select>
        </div>
      </div>
      
      <button 
        type="submit"
        className="w-full md:w-auto mt-2 md:mt-0 bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white font-bold text-base md:text-lg px-8 py-4 rounded-[1.5rem] md:rounded-full whitespace-nowrap transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98] md:ml-2"
      >
        Search Rooms
      </button>
    </form>
  )
}
