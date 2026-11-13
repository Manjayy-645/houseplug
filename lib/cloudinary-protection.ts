/**
 * HousePlug — Cloudinary Historical Spike Protection & Quota Safety
 * 
 * Provides centralized limits, quota-tier calculations, usage monitoring,
 * and graceful fallback guardrails for HousePlug's Free Cloudinary plan (25 credits/mo).
 */

export interface CloudinaryUsageMetrics {
  plan: string
  creditsUsed: number
  creditsLimit: number
  storageGB: number
  storageLimitGB: number
  bandwidth30dGB: number
  bandwidthLimitGB: number
  transformationsCount: number
  lastUpdated: string
  source: "live_api" | "cached" | "conservative_fallback"
}

export type CloudinaryTier = "green" | "warning" | "restrict_uploads" | "restrict_playback" | "critical"

export interface CloudinaryProtectionPolicy {
  tier: CloudinaryTier
  uploadsAllowed: boolean
  playbackAllowed: boolean
  maxVideoSizeBytes: number
  maxVideoDurationSeconds: number
  statusMessage: string
  metrics: CloudinaryUsageMetrics
}

// Configurable Internal Quota Targets (Free Plan: 25.0 Credits)
export const CLOUDINARY_LIMITS = {
  // Bandwidth & Storage Targets
  BANDWIDTH_TARGET_GB: 12.0,      // Rolling 30-day internal target (GB)
  STORAGE_TARGET_GB: 2.5,         // Max storage allocation target (GB)
  TOTAL_CREDIT_CAP: 25.0,         // Free plan monthly credit ceiling

  // Credit Threshold Tiers
  TIER_WARNING_CREDITS: 12.0,     // Early warning notification for admin
  TIER_RESTRICT_UPLOADS: 15.0,    // Pause new video uploads; guide landlords to free Supabase photos
  TIER_RESTRICT_PLAYBACK: 18.0,   // Replace video player with static poster + WhatsApp CTA
  TIER_CRITICAL_CREDITS: 22.0,    // Hard kill-switch to avoid credit overage

  // Video Optimization Pilot Limits
  MAX_VIDEO_SIZE_MB: 15,          // Slashed from 100MB to 15MB
  MAX_VIDEO_SIZE_BYTES: 15 * 1024 * 1024,
  MAX_VIDEO_DURATION_SECONDS: 30, // 30-second tour cap
  MAX_VIDEOS_PER_LISTING: 1,      // Strictly 1 video tour per listing
}

// Verified baseline figures reported from account review
const CONSERVATIVE_BASELINE: CloudinaryUsageMetrics = {
  plan: "Free",
  creditsUsed: 8.3,
  creditsLimit: 25.0,
  storageGB: 1.76,
  storageLimitGB: 2.5,
  bandwidth30dGB: 7.62,
  bandwidthLimitGB: 12.0,
  transformationsCount: 1120,
  lastUpdated: new Date().toISOString(),
  source: "conservative_fallback",
}

// In-memory cache for usage metrics (5-minute TTL to prevent API spam)
let cachedMetrics: CloudinaryUsageMetrics | null = null
let cacheExpiresAt = 0
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Fetch real-time Cloudinary usage metrics via Cloudinary Admin API,
 * or return conservative cached/baseline state if unavailable.
 */
export async function getCloudinaryMetrics(): Promise<CloudinaryUsageMetrics> {
  const now = Date.now()
  if (cachedMetrics && now < cacheExpiresAt) {
    return cachedMetrics
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    // API credentials not configured in this environment — return conservative baseline
    return CONSERVATIVE_BASELINE
  }

  try {
    const authHeader = "Basic " + Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/usage`, {
      headers: {
        Authorization: authHeader,
      },
      signal: controller.signal,
      next: { revalidate: 300 }, // Cache 5 min in Next.js data cache if applicable
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      console.warn(`[CLOUDINARY_PROTECTION] Admin API returned status ${res.status}. Using baseline.`)
      return cachedMetrics || CONSERVATIVE_BASELINE
    }

    const data = await res.json()

    const storageBytes = data.storage?.usage || (1.76 * 1024 * 1024 * 1024)
    const bandwidthBytes = data.bandwidth?.usage || (7.62 * 1024 * 1024 * 1024)
    const storageGB = Number((storageBytes / (1024 * 1024 * 1024)).toFixed(2))
    const bandwidthGB = Number((bandwidthBytes / (1024 * 1024 * 1024)).toFixed(2))
    const creditsUsed = typeof data.credits?.usage === "number" 
      ? Number(data.credits.usage.toFixed(2))
      : Number((storageGB + bandwidthGB + (data.transformations?.usage || 0) / 1000).toFixed(2))

    const metrics: CloudinaryUsageMetrics = {
      plan: data.plan || "Free",
      creditsUsed,
      creditsLimit: data.credits?.limit || 25.0,
      storageGB,
      storageLimitGB: CLOUDINARY_LIMITS.STORAGE_TARGET_GB,
      bandwidth30dGB: bandwidthGB,
      bandwidthLimitGB: CLOUDINARY_LIMITS.BANDWIDTH_TARGET_GB,
      transformationsCount: data.transformations?.usage || 1120,
      lastUpdated: data.last_updated || new Date().toISOString(),
      source: "live_api",
    }

    cachedMetrics = metrics
    cacheExpiresAt = now + CACHE_TTL_MS
    return metrics
  } catch (err) {
    console.warn("[CLOUDINARY_PROTECTION] Failed to reach Cloudinary usage API, falling back to safe state:", err)
    return cachedMetrics || CONSERVATIVE_BASELINE
  }
}

/**
 * Determine the current Cloudinary safety tier and operational policies.
 */
export async function getCloudinaryPolicy(): Promise<CloudinaryProtectionPolicy> {
  const metrics = await getCloudinaryMetrics()
  const credits = metrics.creditsUsed

  let tier: CloudinaryTier = "green"
  let uploadsAllowed = true
  let playbackAllowed = true
  let statusMessage = "Cloudinary media delivery is healthy and within free plan targets."

  if (credits >= CLOUDINARY_LIMITS.TIER_CRITICAL_CREDITS) {
    tier = "critical"
    uploadsAllowed = false
    playbackAllowed = false
    statusMessage = "CRITICAL: Cloudinary credits near limit. Media streaming paused to prevent overages."
  } else if (credits >= CLOUDINARY_LIMITS.TIER_RESTRICT_PLAYBACK) {
    tier = "restrict_playback"
    uploadsAllowed = false
    playbackAllowed = false
    statusMessage = "High credit usage: Embedded video playback paused. Video tours accessible via WhatsApp."
  } else if (credits >= CLOUDINARY_LIMITS.TIER_RESTRICT_UPLOADS) {
    tier = "restrict_uploads"
    uploadsAllowed = false
    playbackAllowed = true
    statusMessage = "Video tour uploads temporarily paused to preserve bandwidth. Unlimited photos enabled."
  } else if (credits >= CLOUDINARY_LIMITS.TIER_WARNING_CREDITS || metrics.bandwidth30dGB >= CLOUDINARY_LIMITS.BANDWIDTH_TARGET_GB) {
    tier = "warning"
    uploadsAllowed = true
    playbackAllowed = true
    statusMessage = "Approaching bandwidth target. Video optimization policies are active."
  }

  return {
    tier,
    uploadsAllowed,
    playbackAllowed,
    maxVideoSizeBytes: CLOUDINARY_LIMITS.MAX_VIDEO_SIZE_BYTES,
    maxVideoDurationSeconds: CLOUDINARY_LIMITS.MAX_VIDEO_DURATION_SECONDS,
    statusMessage,
    metrics,
  }
}
