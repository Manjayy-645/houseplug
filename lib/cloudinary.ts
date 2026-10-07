// Unsigned Cloudinary video upload from the browser. Requires:
//   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
//   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET  (unsigned preset, video-only, <=100MB)
export async function uploadVideo(file: File): Promise<string> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

  if (!cloudName || !uploadPreset) {
    throw new Error("Video upload is not configured.")
  }

  const formData = new FormData()
  formData.append("file", file)
  formData.append("upload_preset", uploadPreset)
  // Note: eager/eager_async are NOT allowed with unsigned presets.
  // H.264 compatibility is handled at render time via streamableVideoUrl().

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
 * Rewrite a stored Cloudinary video URL so it streams as web-playable H.264
 * MP4. Phone uploads are often .mov / HEVC, which Chrome and Firefox cannot
 * decode from the original — Cloudinary transcodes on delivery when we ask for
 * an mp4 + h264 + auto quality. Non-Cloudinary URLs are returned untouched.
 */
export function streamableVideoUrl(url?: string | null): string {
  if (!url) return ""
  if (!url.includes("/video/upload/")) return url
  // Inject the delivery transformation right after /upload/.
  let out = url.replace("/video/upload/", "/video/upload/f_mp4,vc_h264,q_auto/")
  // Force the .mp4 container extension so the browser gets an H.264 stream.
  out = out.replace(/\.(mov|m4v|webm|mkv|avi|hevc|3gp)$/i, ".mp4")
  return out
}

export function getSafariCompatibleVideoUrl(url: string | null | undefined): string {
  if (!url) return ""
  
  // Only transform Cloudinary URLs
  if (!url.includes('cloudinary.com')) return url
  
  // Already has transformations — don't double-add
  if (url.includes('vc_h264') || url.includes('f_mp4,')) return url
  
  // Insert transformation after /upload/
  return url.replace(
    '/upload/',
    '/upload/vc_h264,f_mp4,q_auto/'
  )
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
    // If it's a relative URL, we return it absolute to HousePlug (for safety)
    url = "https://houseplug.ng" + (url.startsWith("/") ? url : "/" + url)
  }

  // Only transform known Cloudinary URLs
  if (!url.includes("res.cloudinary.com")) {
    return url
  }

  try {
    if (isVideo) {
      // For videos: capture frame at 1s, crop, limit quality to 75, force JPEG.
      // E.g., /video/upload/v1234/file.mp4 -> /video/upload/so_1.0,w_1200,h_630,c_fill,q_75,f_jpg/v1234/file.jpg
      let out = url.replace(
        /\/video\/upload\/(?:v\d+\/)?/,
        (match) => match.includes("v")
          ? "/video/upload/so_1.0,w_1200,h_630,c_fill,q_75,f_jpg/" + match.split("/").pop() + "/"
          : "/video/upload/so_1.0,w_1200,h_630,c_fill,q_75,f_jpg/"
      )
      // Strip any existing extensions like .mp4, .mov, etc and force .jpg
      out = out.replace(/\.(mp4|mov|webm|mkv|avi|hevc|3gp|m4v)$/i, ".jpg")
      return out
    } else {
      // For images: resize, fill, limit quality to 75, force JPEG.
      let out = url.replace(
        /\/image\/upload\/(?:v\d+\/)?/,
        (match) => match.includes("v")
          ? "/image/upload/w_1200,h_630,c_fill,q_75,f_jpg/" + match.split("/").pop() + "/"
          : "/image/upload/w_1200,h_630,c_fill,q_75,f_jpg/"
      )
      // Force jpg extension if it ends in standard formats
      out = out.replace(/\.(png|webp|avif|heic|gif)$/i, ".jpg")
      return out
    }
  } catch (err) {
    // Failsafe
    return fallback
  }
}
