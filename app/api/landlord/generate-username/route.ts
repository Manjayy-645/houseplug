import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { data: profile, error: fetchError } = await serviceClient
      .from('profiles')
      .select('full_name, username')
      .eq('id', user.id)
      .single()

    if (fetchError) throw fetchError

    if (profile.username) {
      return NextResponse.json({ username: profile.username })
    }

    const { data: username, error: rpcError } = await serviceClient.rpc('generate_username', {
      full_name: profile.full_name
    })

    if (rpcError) throw rpcError

    const { error: updateError } = await serviceClient
      .from('profiles')
      .update({ username })
      .eq('id', user.id)

    if (updateError) throw updateError

    return NextResponse.json({ username })
  } catch (error: any) {
    console.error('[GENERATE_USERNAME] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
