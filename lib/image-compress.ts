"use client"

type CompressOptions = {
  /** Longest edge of the output, in px. Larger images are scaled down. */
  maxDimension?: number
  /** WebP quality, 0–1. */
  quality?: number
  /** Files already smaller than this (bytes) are left untouched. */
  skipUnder?: number
}

/**
 * Downscale and re-encode a photo to WebP in the browser before upload, so we
 * don't store full-size DSLR/phone originals. Pure canvas — no dependencies.
 *
 * Always falls back to the original File when it can't do better (unsupported
 * type, decode failure, or the re-encode ends up larger), so callers can use
 * the result unconditionally.
 */
export async function compressImage(file: File, opts: CompressOptions = {}): Promise<File> {
  const { maxDimension = 1600, quality = 0.8, skipUnder = 300 * 1024 } = opts

  // Re-encode any raster image (including iPhone HEIC) — browsers that can
  // decode it get a downscaled WebP; ones that can't fall back to the original.
  // Leave animated/vector formats untouched so we don't flatten them.
  if (!file.type.startsWith("image/")) return file
  if (/^image\/(gif|svg\+xml)$/i.test(file.type)) return file
  if (file.size <= skipUnder) return file

  let img: HTMLImageElement
  try {
    img = await loadImage(file)
  } catch {
    return file
  }

  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
  const targetW = Math.round(img.width * scale)
  const targetH = Math.round(img.height * scale)

  const canvas = document.createElement("canvas")
  canvas.width = targetW
  canvas.height = targetH
  const ctx = canvas.getContext("2d")
  if (!ctx) return file
  ctx.drawImage(img, 0, 0, targetW, targetH)

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality)
  )
  // No blob, or the re-encode didn't actually save anything — keep the original.
  if (!blob || blob.size >= file.size) return file

  const newName = file.name.replace(/\.\w+$/, "") + ".webp"
  return new File([blob], newName, { type: "image/webp", lastModified: Date.now() })
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
    img.src = url
  })
}
