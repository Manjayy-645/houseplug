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

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
    { method: "POST", body: formData }
  )

  if (!res.ok) throw new Error("Video upload failed")

  const data = await res.json()
  return data.secure_url as string
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

