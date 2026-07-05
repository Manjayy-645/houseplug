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

  const { appealId, action } = await request.json()
  if (!appealId || !action) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const serviceClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { data: appeal } = await serviceClient.from('appeals').select('*, user:profiles(email)').eq('id', appealId).single()
    if (!appeal) throw new Error("Appeal not found")

    if (action === 'approve') {
      await serviceClient.from('appeals').update({ status: 'approved', reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq('id', appealId)
      await serviceClient.from('profiles').update({ banned: false }).eq('id', appeal.user_id)
      await serviceClient.from('bans').update({ is_active: false }).eq('user_id', appeal.user_id).eq('is_active', true)
      
      // Send approval email
      if ((appeal.user as any)?.email) {
        try {
          const { Resend } = require('resend')
          const resend = new Resend(process.env.RESEND_API_KEY)
          await resend.emails.send({
            from: "HousePlug <noreply@send.houseplug.ng>",
            to: (appeal.user as any).email,
            subject: "Your HousePlug appeal has been approved",
            html: `<p>Good news! Your appeal has been approved and your account is restored.</p><p>You can now log in and continue using HousePlug.</p>`
          })
        } catch (e) {
          console.error("Failed to send approval email", e)
        }
      }

      await logAdminAction({ admin_id: user.id, action: 'approved_appeal', target_type: 'user', target_id: appeal.user_id, details: { appealId } })
      return NextResponse.json({ success: true })
    }

    if (action === 'reject') {
      await serviceClient.from('appeals').update({ status: 'rejected', reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq('id', appealId)
      
      // Send rejection email
      if ((appeal.user as any)?.email) {
        try {
          const { Resend } = require('resend')
          const resend = new Resend(process.env.RESEND_API_KEY)
          await resend.emails.send({
            from: "HousePlug <noreply@send.houseplug.ng>",
            to: (appeal.user as any).email,
            subject: "Update regarding your HousePlug appeal",
            html: `<p>Your appeal has been reviewed and your ban remains active.</p><p>If you have any questions, please contact support.</p>`
          })
        } catch (e) {
          console.error("Failed to send rejection email", e)
        }
      }

      await logAdminAction({ admin_id: user.id, action: 'rejected_appeal', target_type: 'user', target_id: appeal.user_id, details: { appealId } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
