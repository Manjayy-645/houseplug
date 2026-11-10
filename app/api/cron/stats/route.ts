import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendLandlordAnalyticsEmail } from '@/lib/email'

export async function GET(request: Request) {
  // Verify Cron Secret (fail-closed: reject if secret is missing or header doesn't match)
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // 1. Fetch all landlords and agents who have listings
    const { data: landlords, error: lError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        listings(status, views_count, whatsapp_clicks, phone_reveals)
      `)
      .in('role', ['landlord', 'agent'])

    if (lError) throw lError

    let sentCount = 0

    for (const landlord of (landlords || [])) {
      if (!landlord.email || !landlord.listings || landlord.listings.length === 0) continue

      const activeListings = landlord.listings.filter((l: any) => l.status === 'active').length
      
      // Aggregate stats across all listings for this landlord
      const stats = landlord.listings.reduce((acc: any, curr: any) => ({
        views: acc.views + (curr.views_count || 0),
        whatsapp: acc.whatsapp + (curr.whatsapp_clicks || 0),
        phone: acc.phone + (curr.phone_reveals || 0)
      }), { views: 0, whatsapp: 0, phone: 0 })

      // Only send if they have some activity or active listings
      if (stats.views > 0 || activeListings > 0) {
        await sendLandlordAnalyticsEmail({
          email: landlord.email,
          fullName: landlord.full_name || 'Landlord',
          stats: {
            ...stats,
            activeListings
          }
        })
        sentCount++
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Analytics emails sent to ${sentCount} landlords` 
    })
  } catch (error: any) {
    console.error('[CRON_STATS] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
