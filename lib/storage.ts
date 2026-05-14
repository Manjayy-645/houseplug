import { createClient as createSupabaseClient } from '@supabase/supabase-js'

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
