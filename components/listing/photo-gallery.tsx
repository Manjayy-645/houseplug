"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import * as Dialog from "@radix-ui/react-dialog"
import { House, X, ChevronLeft, ChevronRight, Maximize2, Play, Video as VideoIcon } from "lucide-react"
import { getOptimizedVideoUrl, getVideoPosterUrl } from "@/lib/cloudinary"

type PhotoGalleryProps = {
  photos: string[]
  videoUrl?: string | null
  playbackRestricted?: boolean
}

type MediaItem = { type: "video" | "image"; url: string }

export default function PhotoGallery({ photos, videoUrl, playbackRestricted = false }: PhotoGalleryProps) {
  const safePhotos = photos ?? []

  // Prefer still photos first to eliminate video streaming unless visitor chooses to watch.
  // If no photos exist, video is placed first.
  const mediaItems: MediaItem[] = useMemo(() => {
    const photoItems = safePhotos.map((url) => ({ type: "image" as const, url }))
    const videoItems = videoUrl ? [{ type: "video" as const, url: videoUrl }] : []

    if (photoItems.length > 0) {
      return [...photoItems, ...videoItems]
    }
    return videoItems
  }, [videoUrl, safePhotos])

  const [heroIndex, setHeroIndex] = useState(0)
  const [isPlayingVideo, setIsPlayingVideo] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const heroItem = mediaItems[heroIndex]
  const thumbnails = useMemo(() => mediaItems.slice(0, 4), [mediaItems])

  const nextPhoto = () => setLightboxIndex((prev) => (prev + 1) % safePhotos.length)
  const prevPhoto = () => setLightboxIndex((prev) => (prev - 1 + safePhotos.length) % safePhotos.length)

  // Switch hero item and reset play state
  const handleSelectMedia = (idx: number) => {
    setHeroIndex(idx)
    setIsPlayingVideo(false)
  }

  // Open the lightbox at a given photo url (images only).
  const openLightboxForUrl = (url: string) => {
    const idx = safePhotos.indexOf(url)
    if (idx < 0) return
    setLightboxIndex(idx)
    setLightboxOpen(true)
  }

  if (mediaItems.length === 0) {
    return (
      <div className="flex h-[500px] w-full items-center justify-center rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <House className="h-10 w-10" />
          <p className="text-sm">No media available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Hero — static photo or click-to-play video poster */}
      <div className="group relative overflow-hidden sm:rounded-2xl border-y sm:border border-gray-200 bg-black shadow-sm">
        <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] w-full">
          {heroItem.type === "video" ? (
            playbackRestricted ? (
              // Graceful fallback when video bandwidth conservation is active
              <div className="relative h-full w-full bg-gray-950 flex flex-col items-center justify-center p-6 text-center text-white">
                <img
                  src={getVideoPosterUrl(heroItem.url, 1280)}
                  alt="Video tour archived preview"
                  className="absolute inset-0 h-full w-full object-cover opacity-20 filter blur-xs"
                />
                <div className="relative z-10 max-w-md space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-amber-300">
                    <VideoIcon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-black">Video Walkthrough Available</h3>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    This property has a recorded video walkthrough. Message the listing agent directly on WhatsApp below to receive the video tour.
                  </p>
                </div>
              </div>
            ) : isPlayingVideo ? (
              // Mount video tag ONLY upon user explicit click on Play
              <video
                src={getOptimizedVideoUrl(heroItem.url)}
                autoPlay
                controls
                playsInline
                preload="none"
                controlsList="nodownload noplaybackrate"
                disablePictureInPicture
                onContextMenu={(e) => e.preventDefault()}
                className="h-full w-full bg-black object-contain"
              />
            ) : (
              // Zero-bandwidth click-to-play static image poster
              <div className="relative h-full w-full bg-black flex items-center justify-center overflow-hidden">
                <img
                  src={getVideoPosterUrl(heroItem.url, 1280)}
                  alt="Video tour preview"
                  className="h-full w-full object-contain"
                />
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPlayingVideo(true)}
                    className="flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-[#1B4332] text-white font-black text-sm shadow-2xl hover:bg-[#143427] hover:scale-105 active:scale-95 transition-all"
                    aria-label="Play video tour"
                  >
                    <Play className="h-5 w-5 fill-white" />
                    <span>Watch Video Tour (30s)</span>
                  </button>
                  <span className="text-[11px] text-white/90 font-semibold bg-black/50 px-3 py-1 rounded-full backdrop-blur-xs">
                    Tap to play · Data-optimized
                  </span>
                </div>
              </div>
            )
          ) : (
            <button
              type="button"
              onClick={() => openLightboxForUrl(heroItem.url)}
              className="block h-full w-full cursor-zoom-in"
              aria-label="View photo"
            >
              <Image
                src={heroItem.url}
                alt="Listing photo"
                fill
                priority
                sizes="(max-width: 1280px) 100vw, 1280px"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="bg-white/90 p-3 rounded-full shadow-lg">
                  <Maximize2 className="w-6 h-6 text-gray-900" />
                </div>
              </div>
            </button>
          )}

          {mediaItems.length > 1 && (
            <div className="absolute bottom-3 right-3 z-10 rounded-lg bg-black/60 px-2 py-1 text-xs font-medium text-white">
              {heroIndex + 1} / {mediaItems.length}
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail Bar — All items use lightweight static images */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-0">
        <div className="grid flex-1 grid-cols-4 gap-2">
          {thumbnails.map((item, idx) => (
            <button
              key={`${item.url}-${idx}`}
              type="button"
              onClick={() => handleSelectMedia(idx)}
              className={`relative h-14 sm:h-16 overflow-hidden rounded-lg sm:rounded-xl border transition ${
                heroIndex === idx ? "border-[#1B4332] ring-2 ring-[#1B4332]/10" : "border-gray-200 hover:border-[#1B4332]/60"
              }`}
            >
              {item.type === "video" ? (
                <div className="relative h-full w-full bg-gray-900">
                  <img
                    src={getVideoPosterUrl(item.url, 240)}
                    alt="Video tour thumbnail"
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="p-1 rounded-full bg-white/90 text-[#1B4332]">
                      <Play className="h-3 w-3 fill-current" />
                    </div>
                  </div>
                  <span className="absolute left-1 top-1 rounded bg-[#1B4332] px-1 text-[9px] font-bold text-white">
                    TOUR
                  </span>
                </div>
              ) : (
                <img src={item.url} alt={`Media ${idx + 1}`} loading="lazy" className="w-full h-full object-cover" />
              )}
              {idx === 0 && item.type !== "video" && (
                <span className="absolute left-1 top-1 rounded bg-[#1B4332] px-1 text-[9px] font-bold text-white">
                  MAIN
                </span>
              )}
            </button>
          ))}
        </div>

        {safePhotos.length > 0 && (
          <button
            type="button"
            onClick={() => openLightboxForUrl(safePhotos[0])}
            className="shrink-0 rounded-lg sm:rounded-xl bg-[#F59E0B] px-3 py-2 text-xs sm:text-sm font-bold text-gray-900 hover:brightness-95 shadow-sm active:scale-95 transition"
          >
            {safePhotos.length}+ Photos
          </button>
        )}
      </div>

      <Dialog.Root open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/95 animate-in fade-in duration-300" />
          <Dialog.Content className="fixed inset-0 z-[101] flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
            <div className="absolute top-4 right-4 z-[102] flex items-center gap-4">
              <span className="text-white text-sm font-medium bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                {lightboxIndex + 1} / {safePhotos.length}
              </span>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close"
                  className="rounded-full p-2 text-white hover:bg-white/10 transition-colors backdrop-blur-sm"
                >
                  <X className="h-6 w-6" />
                </button>
              </Dialog.Close>
            </div>

            <div className="relative h-full w-full max-w-5xl flex items-center justify-center p-4">
              {safePhotos.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-4 z-[102] p-2 text-white hover:bg-white/10 rounded-full transition-colors backdrop-blur-sm sm:left-8"
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="absolute right-4 z-[102] p-2 text-white hover:bg-white/10 rounded-full transition-colors backdrop-blur-sm sm:right-8"
                  >
                    <ChevronRight className="h-8 w-8" />
                  </button>
                </>
              )}

              {safePhotos[lightboxIndex] && (
                <div className="relative h-[80vh] w-full animate-in fade-in duration-500">
                  <Image
                    src={safePhotos[lightboxIndex]}
                    alt={`Photo ${lightboxIndex + 1}`}
                    fill
                    className="object-contain"
                    sizes="100vw"
                  />
                </div>
              )}
            </div>

            <div className="absolute bottom-6 left-0 right-0 overflow-x-auto pb-2 scrollbar-hide">
              <div className="flex justify-center gap-2 px-4 min-w-max">
                {safePhotos.map((src, idx) => (
                  <button
                    key={idx}
                    onClick={() => setLightboxIndex(idx)}
                    className={`relative h-16 w-16 overflow-hidden rounded-lg border-2 transition-all ${
                      lightboxIndex === idx ? "border-[#F59E0B] scale-110" : "border-transparent opacity-50 hover:opacity-100"
                    }`}
                  >
                    <Image src={src} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
