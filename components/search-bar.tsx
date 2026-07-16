"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"

export function SearchBar() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const initialQuery = searchParams.get("q") ?? ""
  const [query, setQuery] = useState(initialQuery)

  // Keep a ref to the latest searchParams so the debounce effect
  // can read them without re-triggering on every URL change.
  const searchParamsRef = useRef(searchParams)
  useEffect(() => {
    searchParamsRef.current = searchParams
  }, [searchParams])

  // Sync local state when the URL's q param changes externally
  // (e.g. back/forward navigation).
  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  useEffect(() => {
    const trimmed = query.trim()
    const currentQ = searchParamsRef.current.get("q") ?? ""

    // Only navigate when the query actually changed from URL state
    if (trimmed === currentQ) return

    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParamsRef.current.toString())
      if (trimmed) {
        params.set("q", trimmed)
      } else {
        params.delete("q")
      }
      // Reset to page 1 when search query changes
      params.delete("page")
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }, 300)

    return () => clearTimeout(timeout)
  }, [query, pathname, router])

  const clear = useCallback(() => {
    setQuery("")
    const params = new URLSearchParams(searchParamsRef.current.toString())
    params.delete("q")
    params.delete("page")
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [pathname, router])

  return (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by area, street or landmark near your campus..."
        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-10 text-sm font-medium text-gray-900 outline-none transition focus:border-[#1B4332] focus:bg-white"
      />
      {query ? (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-800"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}
