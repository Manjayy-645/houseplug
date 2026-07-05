import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { listingId, appealType, appealMessage } = await request.json()
  if (!listingId || !appealType || !appealMessage) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  try {
    // Verify landlord owns the listing
    const { data: listing } = await supabase.from('listings').select('id, title, status').eq('id', listingId).eq('landlord_id', user.id).single()
    if (!listing) return NextResponse.json({ error: 'Listing not found or not owned by user' }, { status: 404 })

    const serviceClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Insert appeal
    const { error } = await serviceClient.from('listing_appeals').insert({
      listing_id: listingId,
      landlord_id: user.id,
      appeal_type: appealType,
      appeal_message: appealMessage
    })
    if (error) throw error

    // Update listing status to pending if it's a dispute, so admin sees it's under review? 
    // Wait, prompt: "After either action: show 'Your listing is under review' status"
    // So update listing status back to 'pending'
    await serviceClient.from('listings').update({ status: 'pending' }).eq('id', listingId)

    // Send email to admin
    const { data: landlord } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    try {
      const { Resend } = require('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: "HousePlug System <noreply@send.houseplug.ng>",
        to: "mezekiel024@uniport.edu.ng",
        subject: "New listing appeal on HousePlug",
        html: `<p>A landlord has submitted a listing appeal.</p>
          <ul>
            <li><strong>Landlord:</strong> ${landlord?.full_name}</li>
            <li><strong>Listing:</strong> ${listing.title}</li>
            <li><strong>Type:</strong> ${appealType}</li>
            <li><strong>Message:</strong> ${appealMessage}</li>
          </ul>
          <p><a href="https://houseplug.ng/admin/listings?status=appeals">Review it in the Admin Panel</a></p>`
      })
    } catch (e) {
      console.error("Failed to send admin notification email", e)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
