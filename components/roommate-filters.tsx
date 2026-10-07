"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Search, BadgeCheck } from "lucide-react"
import { useTransition } from "react"

export function RoommateFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    
    startTransition(() => {
      router.push(`/roommates?${params.toString()}`, { scroll: false })
    })
  }

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center w-full md:w-auto gap-4 flex-1">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input 
            type="text" 
            defaultValue={searchParams.get("q") ?? ""}
            onChange={(e) => handleFilterChange("q", e.target.value)}
            placeholder="Search university or keywords..." 
            className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/20 transition-all outline-none text-sm"
          />
        </div>
      </div>
      
      <div className="hidden md:flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl text-sm font-bold border border-emerald-100 hover:bg-emerald-100 transition-colors">
          <input 
            type="checkbox" 
            className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
            checked={searchParams.get("verified") === "true"}
            onChange={(e) => handleFilterChange("verified", e.target.checked ? "true" : "")}
          />
          <BadgeCheck className="h-4 w-4" /> Verified Only
        </label>
        <select 
          defaultValue={searchParams.get("intent") ?? ""}
          onChange={(e) => handleFilterChange("intent", e.target.value)}
          className="bg-gray-50 border-transparent rounded-xl px-4 py-3 text-gray-700 font-medium focus:ring-2 focus:ring-[#1B4332]/20 outline-none cursor-pointer text-sm"
        >
          <option value="">Any Intent</option>
          <option value="have_room">Has a Room</option>
          <option value="teaming_up">Looking to Team Up</option>
        </select>
        <select 
          defaultValue={searchParams.get("gender") ?? ""}
          onChange={(e) => handleFilterChange("gender", e.target.value)}
          className="bg-gray-50 border-transparent rounded-xl px-4 py-3 text-gray-700 font-medium focus:ring-2 focus:ring-[#1B4332]/20 outline-none cursor-pointer text-sm"
        >
          <option value="">Any Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </div>
    </div>
  )
}
