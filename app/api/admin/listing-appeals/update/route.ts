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
    const { data: appeal } = await serviceClient.from('listing_appeals').select('*, listing:listings(id, title), landlord:profiles(email)').eq('id', appealId).single()
    if (!appeal) throw new Error("Appeal not found")

    if (action === 'approve') {
      await serviceClient.from('listing_appeals').update({ status: 'approved', reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq('id', appealId)
      await serviceClient.from('listings').update({ status: 'pending', rejection_reason: null }).eq('id', appeal.listing_id)
      
      // Send approval email
      if ((appeal.landlord as any)?.email) {
        try {
          const { Resend } = require('resend')
          const resend = new Resend(process.env.RESEND_API_KEY)
          await resend.emails.send({
            from: "HousePlug <noreply@send.houseplug.ng>",
            to: (appeal.landlord as any).email,
            subject: "Your HousePlug listing appeal was approved",
            html: `<p>Good news! Your appeal for the listing "${(appeal.listing as any).title}" has been approved.</p><p>The listing is now pending review and will be live soon.</p>`
          })
        } catch (e) {
          console.error("Failed to send approval email", e)
        }
      }

      await logAdminAction({ admin_id: user.id, action: 'approved_listing_appeal', target_type: 'listing', target_id: appeal.listing_id, details: { appealId } })
      return NextResponse.json({ success: true })
    }

    if (action === 'reject') {
      await serviceClient.from('listing_appeals').update({ status: 'rejected', reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq('id', appealId)
      
      // Send rejection email
      if ((appeal.landlord as any)?.email) {
        try {
          const { Resend } = require('resend')
          const resend = new Resend(process.env.RESEND_API_KEY)
          await resend.emails.send({
            from: "HousePlug <noreply@send.houseplug.ng>",
            to: (appeal.landlord as any).email,
            subject: "Update regarding your HousePlug listing appeal",
            html: `<p>Your appeal for the listing "${(appeal.listing as any).title}" has been reviewed and rejected.</p><p>The listing will remain rejected. Please ensure it complies with our platform guidelines before resubmitting.</p>`
          })
        } catch (e) {
          console.error("Failed to send rejection email", e)
        }
      }

      await logAdminAction({ admin_id: user.id, action: 'rejected_listing_appeal', target_type: 'listing', target_id: appeal.listing_id, details: { appealId } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
