import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createClient()
  
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const { data, error } = await supabase
    .from('activity_events')
    .select('event_type, area, university, created_at')
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(15)

  if (error) {
    return NextResponse.json({ events: [] }, { status: 500 })
  }

  return NextResponse.json({ events: data || [] })
}
