import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string | null> {
  if (!path) return null
  
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)

  if (error) {
    console.error('[STORAGE] Signed URL error:', error)
    return null
  }

  return data.signedUrl
}

export async function getVerificationDocuments(landlord_id: string) {
  const [idFront, idBack, selfie, propertyDoc] = await Promise.all([
    getSignedUrl('verifications', `${landlord_id}/id_front`),
    getSignedUrl('verifications', `${landlord_id}/id_back`),
    getSignedUrl('verifications', `${landlord_id}/selfie`),
    getSignedUrl('verifications', `${landlord_id}/property_doc`),
  ])

  return { idFront, idBack, selfie, propertyDoc }
}

type ListingMedia = {
  id: string
  landlord_id: string | null
  video_url?: string | null
}

/**
 * Remove every stored asset belonging to a listing: its photos (Supabase
 * Storage `listings` bucket) and its tour video (Cloudinary). Call this with a
 * service-role client before deleting the listing row so nothing is orphaned.
 *
 * Never throws — media cleanup must not block the delete itself. Individual
 * failures are logged for follow-up and the other asset is still attempted.
 */
export async function cleanupListingMedia(service: SupabaseClient, listing: ListingMedia) {
  await Promise.allSettled([
    deleteListingPhotos(service, listing),
    deleteListingVideo(listing.video_url),
  ])
}

async function deleteListingPhotos(service: SupabaseClient, listing: ListingMedia) {
  // Photos live under `${landlordId}/${listingId}/` (see listing-form upload).
  if (!listing.landlord_id) return
  const folder = `${listing.landlord_id}/${listing.id}`
  try {
    const { data, error } = await service.storage.from('listings').list(folder)
    if (error) throw error
    if (!data || data.length === 0) return
    const paths = data.map((f) => `${folder}/${f.name}`)
    const { error: removeError } = await service.storage.from('listings').remove(paths)
    if (removeError) throw removeError
  } catch (err) {
    console.error(`[STORAGE] Failed to delete photos for listing ${listing.id}:`, err)
  }
}

async function deleteListingVideo(videoUrl?: string | null) {
  if (!videoUrl) return

  // Deletion needs signed (server-side) Cloudinary credentials. Uploads only
  // use the public cloud name + unsigned preset, so these may be unset; if so,
  // skip gracefully (the video stays, but the delete path still succeeds).
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) {
    console.warn('[STORAGE] Cloudinary API credentials not set; skipping video delete:', videoUrl)
    return
  }

  const publicId = cloudinaryPublicId(videoUrl)
  if (!publicId) {
    console.warn('[STORAGE] Could not parse Cloudinary public_id from:', videoUrl)
    return
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000)
    // Cloudinary signs the sorted params + api_secret with SHA-1.
    const signature = crypto
      .createHash('sha1')
      .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex')

    const body = new URLSearchParams({
      public_id: publicId,
      timestamp: String(timestamp),
      api_key: apiKey,
      signature,
    })

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/destroy`, {
      method: 'POST',
      body,
    })
    const json = await res.json()
    // "not found" is fine — the asset is already gone, which is the goal.
    if (json.result !== 'ok' && json.result !== 'not found') {
      throw new Error(JSON.stringify(json))
    }
  } catch (err) {
    console.error(`[STORAGE] Failed to delete Cloudinary video ${videoUrl}:`, err)
  }
}

/**
 * Extract the Cloudinary public_id (folder included, extension stripped) from a
 * secure_url like:
 *   https://res.cloudinary.com/<cloud>/video/upload/v1700000000/folder/abc.mp4
 *                                              -> "folder/abc"
 */
function cloudinaryPublicId(url: string): string | null {
  const marker = '/upload/'
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  let rest = url.slice(idx + marker.length)
  rest = rest.replace(/^v\d+\//, '') // drop optional version segment
  rest = rest.replace(/\.[a-zA-Z0-9]+$/, '') // drop file extension
  return rest || null
}
