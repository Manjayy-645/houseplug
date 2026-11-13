import { CLOUDINARY_LIMITS } from "./cloudinary-protection"

/**
 * Validates a video file in the browser for size (<= 15MB) and duration (<= 30s).
 */
export async function validateVideoFile(file: File): Promise<{
  valid: boolean
  error?: string
  duration?: number
  sizeMB: number
}> {
  const sizeMB = Number((file.size / (1024 * 1024)).toFixed(2))

  if (file.size > CLOUDINARY_LIMITS.MAX_VIDEO_SIZE_BYTES) {
    return {
      valid: false,
      error: `Video size is ${sizeMB}MB. Maximum allowed is ${CLOUDINARY_LIMITS.MAX_VIDEO_SIZE_MB}MB to keep HousePlug fast on mobile networks.`,
      sizeMB,
    }
  }

  // Check duration via temporary HTML5 video element
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    try {
      const duration = await new Promise<number>((resolve, reject) => {
        const video = document.createElement("video")
        video.preload = "metadata"
        const objectUrl = URL.createObjectURL(file)
        
        const cleanup = () => {
          URL.revokeObjectURL(objectUrl)
          video.remove()
        }

        video.onloadedmetadata = () => {
          const d = video.duration
          cleanup()
          resolve(d)
        }

        video.onerror = () => {
          cleanup()
          reject(new Error("Could not read video metadata."))
        }

        video.src = objectUrl
      })

      if (duration > CLOUDINARY_LIMITS.MAX_VIDEO_DURATION_SECONDS + 0.5) {
        return {
          valid: false,
          error: `Video length is ${Math.round(duration)} seconds. Tour videos must be ${CLOUDINARY_LIMITS.MAX_VIDEO_DURATION_SECONDS} seconds or less.`,
          duration,
          sizeMB,
        }
      }

      return { valid: true, duration, sizeMB }
    } catch {
      // If browser can't decode container metadata, allow upload if size is strictly under limit
      return { valid: true, sizeMB }
    }
  }

  return { valid: true, sizeMB }
}

/**
 * Unsigned Cloudinary video upload from the browser with pilot size validation.
 */
export async function uploadVideo(file: File): Promise<string> {
  const validation = await validateVideoFile(file)
  if (!validation.valid) {
    throw new Error(validation.error || "Video validation failed.")
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    throw new Error("Video upload is not configured.")
  }

  const formData = new FormData()
  formData.append("file", file)
  formData.append("upload_preset", uploadPreset)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
    { method: "POST", body: formData }
  )

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    throw new Error(errBody?.error?.message ?? "Video upload failed")
  }

  const data = await res.json()
  return data.eager?.[0]?.secure_url ?? data.secure_url
}

/**
 * Canonical Cloudinary Video Delivery URL.
 * 
 * Replaces divergent transformation strings with a unified, cache-friendly derivative:
 * - H.264 video codec (`vc_h264`) for universal mobile/Safari/Chrome playback
 * - Width limit (`w_1280,c_limit`) downscales 4K/1080p uploads to 720p cap
 * - Auto quality (`q_auto:good`) for optimal bandwidth without visual artifacting
 * - MP4 container (`f_mp4`)
 */
export function getOptimizedVideoUrl(url?: string | null): string {
  if (!url) return ""
  if (!url.includes("cloudinary.com") || !url.includes("/video/upload/")) return url

  // Normalize by stripping any previously injected delivery transformations
  let cleaned = url.replace(/\/video\/upload\/[^/]+(?=\/v\d+\/|\/[^/]+$)/, "/video/upload")

  // Inject canonical transformation chain
  let out = cleaned.replace("/video/upload/", "/video/upload/vc_h264,w_1280,c_limit,q_auto:good,f_mp4/")
  out = out.replace(/\.(mov|m4v|webm|mkv|avi|hevc|3gp)$/i, ".mp4")
  return out
}

/**
 * Backward-compatible aliases pointing to the canonical transformation pipeline.
 * Eliminates duplicate on-the-fly derivative generation across components.
 */
export function streamableVideoUrl(url?: string | null): string {
  return getOptimizedVideoUrl(url)
}

export function getSafariCompatibleVideoUrl(url: string | null | undefined): string {
  return getOptimizedVideoUrl(url)
}

/**
 * Extracts a lightweight static JPEG poster from a Cloudinary video URL.
 * 
 * Replaces `<video src="...#t=0.1">` range requests with a ~20KB static image.
 * Captures the exact first frame (so_0.0), scales appropriately, and forces JPEG format.
 */
export function getVideoPosterUrl(url?: string | null, width = 800): string {
  if (!url) return ""
  if (!url.includes("cloudinary.com") || !url.includes("/video/upload/")) return url

  // Strip any existing transformations
  let cleaned = url.replace(/\/video\/upload\/[^/]+(?=\/v\d+\/|\/[^/]+$)/, "/video/upload")

  // Insert static image frame extraction
  let out = cleaned.replace(
    "/video/upload/",
    `/video/upload/so_0.0,w_${width},c_limit,q_auto,f_jpg/`
  )
  out = out.replace(/\.(mp4|mov|m4v|webm|mkv|avi|hevc|3gp)$/i, ".jpg")
  return out
}

/**
 * Generates a WhatsApp-compatible Open Graph preview image URL from a Cloudinary source.
 * WhatsApp requires absolute URLs, strictly <300KB, image/jpeg format, and no dynamic WebP negotiation.
 */
export function getWhatsAppListingOgImage(url?: string | null, isVideo?: boolean): string {
  const fallback = "https://houseplug.ng/icons/og-default.jpg"

  if (!url) return fallback

  // Ensure absolute HTTPS protocol
  if (url.startsWith("http://")) {
    url = url.replace("http://", "https://")
  } else if (!url.startsWith("http")) {
    url = "https://houseplug.ng" + (url.startsWith("/") ? url : "/" + url)
  }

  // Only transform known Cloudinary URLs
  if (!url.includes("res.cloudinary.com")) {
    return url
  }

  try {
    if (isVideo) {
      let out = url.replace(
        /\/video\/upload\/(?:v\d+\/)?/,
        (match) => match.includes("v")
          ? "/video/upload/so_1.0,w_1200,h_630,c_fill,q_75,f_jpg/" + match.split("/").pop() + "/"
          : "/video/upload/so_1.0,w_1200,h_630,c_fill,q_75,f_jpg/"
      )
      out = out.replace(/\.(mp4|mov|webm|mkv|avi|hevc|3gp|m4v)$/i, ".jpg")
      return out
    } else {
      let out = url.replace(
        /\/image\/upload\/(?:v\d+\/)?/,
        (match) => match.includes("v")
          ? "/image/upload/w_1200,h_630,c_fill,q_75,f_jpg/" + match.split("/").pop() + "/"
          : "/image/upload/w_1200,h_630,c_fill,q_75,f_jpg/"
      )
      out = out.replace(/\.(png|webp|avif|heic|gif)$/i, ".jpg")
      return out
    }
  } catch {
    return fallback
  }
}
