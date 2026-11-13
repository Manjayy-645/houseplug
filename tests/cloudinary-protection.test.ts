import test from "node:test"
import assert from "node:assert/strict"
import {
  getOptimizedVideoUrl,
  getVideoPosterUrl,
  streamableVideoUrl,
  getSafariCompatibleVideoUrl,
  getWhatsAppListingOgImage,
} from "../lib/cloudinary"
import { CLOUDINARY_LIMITS, getCloudinaryPolicy } from "../lib/cloudinary-protection"

const sampleCloudinaryVideoMov = "https://res.cloudinary.com/houseplug/video/upload/v1710000000/listings/tour_sample.mov"
const sampleCloudinaryVideoMp4 = "https://res.cloudinary.com/houseplug/video/upload/v1710000000/listings/tour_sample.mp4"
const sampleExternalVideo = "https://example.com/videos/external.mp4"

test("getOptimizedVideoUrl transforms video to canonical 720p H.264 MP4 with resolution cap", () => {
  const optimizedMov = getOptimizedVideoUrl(sampleCloudinaryVideoMov)
  assert.ok(optimizedMov.includes("/video/upload/vc_h264,w_1280,c_limit,q_auto:good,f_mp4/"))
  assert.ok(optimizedMov.endsWith(".mp4"))
  assert.ok(!optimizedMov.endsWith(".mov"))

  const optimizedMp4 = getOptimizedVideoUrl(sampleCloudinaryVideoMp4)
  assert.ok(optimizedMp4.includes("/video/upload/vc_h264,w_1280,c_limit,q_auto:good,f_mp4/"))
  assert.ok(optimizedMp4.endsWith(".mp4"))
})

test("getOptimizedVideoUrl is idempotent and leaves non-Cloudinary URLs untouched", () => {
  const once = getOptimizedVideoUrl(sampleCloudinaryVideoMov)
  const twice = getOptimizedVideoUrl(once)
  assert.equal(once, twice)

  assert.equal(getOptimizedVideoUrl(sampleExternalVideo), sampleExternalVideo)
  assert.equal(getOptimizedVideoUrl(null), "")
  assert.equal(getOptimizedVideoUrl(undefined), "")
})

test("backward compatible aliases streamableVideoUrl and getSafariCompatibleVideoUrl share identical canonical derivative", () => {
  const canonical = getOptimizedVideoUrl(sampleCloudinaryVideoMov)
  const streamable = streamableVideoUrl(sampleCloudinaryVideoMov)
  const safari = getSafariCompatibleVideoUrl(sampleCloudinaryVideoMov)

  assert.equal(streamable, canonical)
  assert.equal(safari, canonical)
})

test("getVideoPosterUrl generates lightweight static JPEG poster without video stream bytes", () => {
  const poster = getVideoPosterUrl(sampleCloudinaryVideoMov, 800)
  assert.ok(poster.includes("/video/upload/so_0.0,w_800,c_limit,q_auto,f_jpg/"))
  assert.ok(poster.endsWith(".jpg"))
  assert.ok(!poster.includes(".mov"))
  assert.ok(!poster.includes(".mp4"))

  // Thumbnail size poster
  const thumbPoster = getVideoPosterUrl(sampleCloudinaryVideoMov, 240)
  assert.ok(thumbPoster.includes("w_240,c_limit,q_auto,f_jpg"))
  assert.ok(thumbPoster.endsWith(".jpg"))
})

test("getWhatsAppListingOgImage strictly outputs jpeg images under WhatsApp specifications", () => {
  const ogFromVideo = getWhatsAppListingOgImage(sampleCloudinaryVideoMov, true)
  assert.ok(ogFromVideo.startsWith("https://"))
  assert.ok(ogFromVideo.includes("f_jpg"))
  assert.ok(ogFromVideo.endsWith(".jpg"))

  // Non-video photo fallback
  const samplePhoto = "https://placeholder-project.supabase.co/storage/v1/object/public/listings/photo.webp"
  const ogFromPhoto = getWhatsAppListingOgImage(samplePhoto, false)
  assert.equal(ogFromPhoto, samplePhoto)
})

test("Cloudinary limits match user-specified cost protection targets", () => {
  assert.equal(CLOUDINARY_LIMITS.BANDWIDTH_TARGET_GB, 12.0)
  assert.equal(CLOUDINARY_LIMITS.STORAGE_TARGET_GB, 2.5)
  assert.equal(CLOUDINARY_LIMITS.TOTAL_CREDIT_CAP, 25.0)
  assert.equal(CLOUDINARY_LIMITS.TIER_WARNING_CREDITS, 12.0)
  assert.equal(CLOUDINARY_LIMITS.TIER_RESTRICT_UPLOADS, 15.0)
  assert.equal(CLOUDINARY_LIMITS.TIER_RESTRICT_PLAYBACK, 18.0)
  assert.equal(CLOUDINARY_LIMITS.TIER_CRITICAL_CREDITS, 22.0)
  assert.equal(CLOUDINARY_LIMITS.MAX_VIDEO_SIZE_MB, 15)
  assert.equal(CLOUDINARY_LIMITS.MAX_VIDEO_DURATION_SECONDS, 30)
})

test("getCloudinaryPolicy returns valid operational policies for current baseline", async () => {
  const policy = await getCloudinaryPolicy()
  assert.ok(policy.metrics)
  assert.equal(typeof policy.metrics.creditsUsed, "number")
  assert.equal(policy.metrics.creditsLimit, 25.0)
  assert.equal(policy.maxVideoSizeBytes, 15 * 1024 * 1024)
  assert.equal(policy.maxVideoDurationSeconds, 30)

  // Current reported credits is 8.3 / 25 -> Should be Green tier
  assert.equal(policy.tier, "green")
  assert.equal(policy.uploadsAllowed, true)
  assert.equal(policy.playbackAllowed, true)
})
