"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import * as Dialog from "@radix-ui/react-dialog"
import { House, X } from "lucide-react"

type PhotoGalleryProps = {
  photos: string[]
}

export default function PhotoGallery({ photos }: PhotoGalleryProps) {
  const safePhotos = photos ?? []
  const [heroIndex, setHeroIndex] = useState(0)
  const heroPhoto = safePhotos[heroIndex]

  const thumbnails = useMemo(() => safePhotos.slice(0, 4), [safePhotos])

  if (safePhotos.length === 0) {
    return (
      <div className="flex h-[500px] w-full items-center justify-center rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <House className="h-10 w-10" />
          <p className="text-sm">No photos available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden sm:rounded-2xl border-y sm:border border-gray-200 bg-white shadow-sm">
        {heroPhoto ? (
          <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] w-full">
            <Image 
              src={heroPhoto} 
              alt="Listing photo" 
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover" 
            />
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 px-4 sm:px-0">
        <div className="grid flex-1 grid-cols-4 gap-2">
          {thumbnails.map((src, idx) => (
            <button
              key={`${src}-${idx}`}
              type="button"
              onClick={() => setHeroIndex(idx)}
              className={`relative h-14 sm:h-16 overflow-hidden rounded-lg sm:rounded-xl border transition ${
                heroIndex === idx ? "border-[#1B4332] ring-2 ring-[#1B4332]/10" : "border-gray-200 hover:border-[#1B4332]/60"
              }`}
            >
              <Image 
                src={src} 
                alt={`Thumbnail ${idx + 1}`} 
                fill
                sizes="100px"
                className="object-cover" 
              />
            </button>
          ))}
        </div>

        <Dialog.Root>
          <Dialog.Trigger asChild>
            <button
              type="button"
              className="shrink-0 rounded-lg sm:rounded-xl bg-[#F59E0B] px-3 py-2 text-xs sm:text-sm font-bold text-gray-900 hover:brightness-95 shadow-sm active:scale-95 transition"
            >
              {safePhotos.length}+ Photos
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 animate-in fade-in duration-200" />
            <Dialog.Content className="fixed inset-0 z-50 m-auto h-[80vh] w-[92vw] max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <Dialog.Title className="text-sm font-semibold text-gray-900">All Photos</Dialog.Title>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    aria-label="Close"
                    className="rounded p-1 text-gray-600 hover:bg-gray-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </Dialog.Close>
              </div>
              <div className="h-[calc(80vh-49px)] overflow-auto p-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {safePhotos.map((src, idx) => (
                    <button
                      key={`${src}-${idx}`}
                      type="button"
                      onClick={() => setHeroIndex(idx)}
                      className="relative aspect-square overflow-hidden rounded-xl border border-gray-200 hover:border-[#1B4332]/60"
                    >
                      <Image 
                        src={src} 
                        alt={`Photo ${idx + 1}`} 
                        fill
                        sizes="(max-width: 768px) 50vw, 250px"
                        className="object-cover" 
                      />
                    </button>
                  ))}
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  )
}

