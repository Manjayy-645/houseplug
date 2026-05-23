import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'

  const supabase = createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      const redirectUrl = await getRedirectUrl(supabase, user?.id)
      return NextResponse.redirect(`${origin}${redirectUrl}`)
    }
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ 
      token_hash, 
      type: type as any
    })
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      const redirectUrl = await getRedirectUrl(supabase, user?.id)
      return NextResponse.redirect(`${origin}${redirectUrl}`)
    }
  }

  // Error — redirect to login with error
  return NextResponse.redirect(
    `${origin}/login?error=verification_failed`
  )
}

async function getRedirectUrl(supabase: any, userId?: string) {
  if (!userId) return '/login'
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  switch (profile?.role) {
    case 'super_admin':
    case 'admin':
      return '/admin/listings'
    case 'landlord':
      return '/landlord/dashboard'
    default:
      return '/browse'
  }
}
