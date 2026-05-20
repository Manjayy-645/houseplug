import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function logAdminAction({
  admin_id,
  action,
  target_type,
  target_id,
  details,
}: {
  admin_id: string
  action: string
  target_type?: string
  target_id?: string
  details?: Record<string, any>
}) {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  await supabase.from('audit_logs').insert({
    admin_id,
    action,
    target_type,
    target_id,
    details,
  })
}
