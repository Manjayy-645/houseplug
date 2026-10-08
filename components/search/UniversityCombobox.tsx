"use client"

import { useState, useRef, useEffect } from "react"
import { Search, Check, PlusCircle } from "lucide-react"
import { UNIVERSITIES } from "@/lib/constants"
import { SuggestUniversityModal } from "@/components/university/SuggestUniversityModal"

interface UniversityComboboxProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
}

export function UniversityCombobox({ value, onChange, placeholder = "Select your university", className = "" }: UniversityComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedUni = UNIVERSITIES.find(u => u.id === value)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filtered = UNIVERSITIES.filter(u => 
    u.name.toLowerCase().includes(query.toLowerCase()) || 
    u.shortName.toLowerCase().includes(query.toLowerCase())
  )

  const hasNoResults = query.trim().length > 0 && filtered.length === 0

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full text-left bg-transparent flex items-center justify-between outline-none"
      >
        <span className={value ? "text-primary font-bold truncate" : "text-gray-400 font-normal truncate"}>
          {selectedUni ? selectedUni.shortName : placeholder}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-2 w-72 max-h-[350px] overflow-y-auto bg-white rounded-xl shadow-xl border border-gray-100 py-2">
          <div className="px-3 py-2 sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search universities..."
                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1B4332]"
              />
            </div>
          </div>
          
          <div className="px-2 mt-1 space-y-1">
            {query.trim() === "" && (
              <button
                type="button"
                onClick={() => {
                  onChange("")
                  setOpen(false)
                }}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between ${
                  value === "" ? "bg-[#1B4332]/10 text-[#1B4332] font-semibold" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>All Universities</span>
                {value === "" && <Check className="w-4 h-4 text-[#1B4332]" />}
              </button>
            )}
            
            {filtered.map(u => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  onChange(u.id)
                  setOpen(false)
                  setQuery("")
                }}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between ${
                  value === u.id ? "bg-[#1B4332]/10 text-[#1B4332] font-semibold" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>{u.shortName} <span className="text-gray-400 font-normal ml-1">— {u.name}</span></span>
                {value === u.id && <Check className="w-4 h-4 text-[#1B4332]" />}
              </button>
            ))}
          </div>

          {hasNoResults && (
            <div className="px-4 py-4 text-center">
              <p className="text-sm font-semibold text-gray-900 mb-1">Can't find your institution?</p>
              <p className="text-xs text-gray-500 mb-4">
                We currently verify lodges only around UniPort, RSU, IAUE, and KenPoly.
              </p>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  setIsModalOpen(true)
                }}
                className="w-full bg-[#1B4332]/5 text-[#1B4332] hover:bg-[#1B4332]/10 font-semibold py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                Suggest {query.trim() || 'Your School'}
              </button>
            </div>
          )}
        </div>
      )}

      <SuggestUniversityModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialUniversityName={query.trim()}
      />
    </div>
  )
}
