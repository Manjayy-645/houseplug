import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { logAdminAction } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'super_admin'].includes(profile?.role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { section, settings } = await request.json()
  if (!section || !settings) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const serviceClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const updates = Object.entries(settings).map(([key, value]) => ({
       key,
       value,
       updated_by: user.id,
       updated_at: new Date().toISOString()
    }))

    const { error } = await serviceClient.from('platform_settings').upsert(updates)
    if (error) throw error

    await logAdminAction({
      admin_id: user.id,
      action: 'updated_settings',
      target_type: 'platform',
      details: { section, ...settings }
    })

    // Revalidate paths so cached middleware and pages update immediately
    revalidatePath('/admin/settings')
    revalidatePath('/', 'layout')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
