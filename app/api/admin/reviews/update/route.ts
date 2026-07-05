import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { logAdminAction } from '@/lib/audit'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'super_admin'].includes(profile?.role || "")) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { reviewId, action } = await request.json()
  if (!reviewId || !action) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const serviceClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { data: review } = await serviceClient.from('reviews').select('review_text, reviewer_name').eq('id', reviewId).single()

    if (action === 'delete') {
      const { error } = await serviceClient.from('reviews').delete().eq('id', reviewId)
      if (error) throw error
      await logAdminAction({ 
        admin_id: user.id, 
        action: 'deleted_review', 
        target_type: 'review', 
        target_id: reviewId, 
        details: { reviewer: review?.reviewer_name, comment: review?.review_text?.substring(0, 50) + '...' } 
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
