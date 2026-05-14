"use client"

import { useState, useEffect, useCallback } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"

type Image = {
  url: string
  label: string
}

type DocumentLightboxProps = {
  images: Image[]
  initialIndex?: number
  onClose: () => void
}

export function DocumentLightbox({ images, initialIndex = 0, onClose }: DocumentLightboxProps) {
  const [currentIndex, setCurrentPage] = useState(initialIndex)

  const handleNext = useCallback(() => {
    setCurrentPage((prev) => (prev + 1) % images.length)
  }, [images.length])

  const handlePrev = useCallback(() => {
    setCurrentPage((prev) => (prev - 1 + images.length) % images.length)
  }, [images.length])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowRight") handleNext()
      if (e.key === "ArrowLeft") handlePrev()
    }

    window.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [onClose, handleNext, handlePrev])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 transition-all duration-300 animate-in fade-in">
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-[110] rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition"
      >
        <X className="h-6 w-6" />
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-6 z-[110] rounded-full bg-white/10 p-4 text-white hover:bg-white/20 transition"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-6 z-[110] rounded-full bg-white/10 p-4 text-white hover:bg-white/20 transition"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </>
      )}

      <div className="flex flex-col items-center max-w-full max-h-full">
        <div className="relative group">
          <img
            src={images[currentIndex].url}
            alt={images[currentIndex].label}
            className="max-h-[80vh] max-w-full object-contain shadow-2xl rounded-lg"
          />
        </div>
        <div className="mt-6 text-center">
          <p className="text-xl font-bold text-white uppercase tracking-wider">
            {images[currentIndex].label}
          </p>
          <p className="text-gray-400 mt-2 font-medium">
            Document {currentIndex + 1} of {images.length}
          </p>
        </div>
      </div>

      {/* Click outside to close */}
      <div 
        className="absolute inset-0 z-[-1]" 
        onClick={onClose}
      />
    </div>
  )
}
