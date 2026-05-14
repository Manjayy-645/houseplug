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
      className="bg-white p-4 md:p-2 rounded-xl md:rounded-full shadow-xl max-w-5xl mx-auto flex flex-col md:flex-row gap-2 items-center border border-white/20 mt-12"
    >
      <div className="w-full md:w-1/3 flex items-center px-4 gap-3 border-b md:border-b-0 md:border-r border-gray-100 py-3 md:py-0">
        <GraduationCap className="h-5 w-5 text-primary" />
        <div className="text-left w-full">
          <span className="block text-[10px] uppercase font-bold text-gray-400">University</span>
          <select 
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            className="w-full border-none p-0 text-primary font-semibold focus:ring-0 appearance-none bg-transparent text-sm"
          >
            <option value="">Select your university</option>
            {UNIVERSITIES.map((u) => (
              <option key={u.id} value={u.id}>{u.shortName}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="w-full md:w-1/3 flex items-center px-4 gap-3 border-b md:border-b-0 md:border-r border-gray-100 py-3 md:py-0">
        <Home className="h-5 w-5 text-primary" />
        <div className="text-left w-full">
          <span className="block text-[10px] uppercase font-bold text-gray-400">Room Type</span>
          <select 
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border-none p-0 text-primary font-semibold focus:ring-0 appearance-none bg-transparent text-sm"
          >
            <option value="">All Types</option>
            {ROOM_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="w-full md:w-1/3 flex items-center px-4 gap-3 py-3 md:py-0">
        <CreditCard className="h-5 w-5 text-primary" />
        <div className="text-left w-full">
          <span className="block text-[10px] uppercase font-bold text-gray-400">Price Range</span>
          <select 
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border-none p-0 text-primary font-semibold focus:ring-0 appearance-none bg-transparent text-sm"
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
        className="w-full md:w-auto bg-secondary-container hover:bg-hp-amber text-primary font-label-lg px-8 py-4 rounded-lg md:rounded-full whitespace-nowrap transition-colors active:scale-95"
      >
        Search Rooms
      </button>
    </form>
  )
}
