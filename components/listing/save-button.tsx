"use client"

import { useState } from "react"
import { Heart } from "lucide-react"
import { useRouter } from "next/navigation"
import { toggleSavedListing } from "@/app/actions"
import { cn } from "@/lib/utils"

type SaveButtonProps = {
  listingId: string
  initialSaved: boolean
  className?: string
  iconClassName?: string
}

export default function SaveButton({ listingId, initialSaved, className, iconClassName }: SaveButtonProps) {
  const [isSaved, setIsSaved] = useState(initialSaved)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation() // Prevent navigating to the listing if clicked from a card
    
    if (isLoading) return

    setIsLoading(true)
    
    // Optimistic update
    const previousState = isSaved
    setIsSaved(!isSaved)

    try {
      const res = await toggleSavedListing(listingId)
      
      if (res.error) {
        setIsSaved(previousState) // Revert on error
        if (res.error === "You must be logged in to save listings.") {
          router.push("/login")
        } else {
          alert(res.error)
        }
      } else if (res.saved !== undefined) {
        setIsSaved(res.saved)
      }
    } catch (err) {
      setIsSaved(previousState) // Revert on error
      alert("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
      router.refresh()
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(
        "flex items-center justify-center rounded-full bg-white/80 p-2 text-gray-600 backdrop-blur-md transition-all hover:scale-110 hover:bg-white hover:text-red-500",
        isSaved && "text-red-500",
        isLoading && "opacity-50 cursor-not-allowed",
        className
      )}
      aria-label={isSaved ? "Unsave listing" : "Save listing"}
    >
      <Heart
        className={cn("h-5 w-5 transition-colors", isSaved && "fill-current text-red-500", iconClassName)}
      />
    </button>
  )
}

