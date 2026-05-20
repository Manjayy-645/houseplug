import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers
    }
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        }
      }
    }
  )

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, banned")
    .eq("id", user.id)
    .single()

  if (profile?.banned) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL("/login?error=account_banned", request.url))
  }

  // Maintenance mode check
  const { data: maintenance } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'maintenance_mode')
    .single()

  if (
    (maintenance?.value === 'true' || maintenance?.value === true) && 
    !['admin', 'super_admin'].includes(profile?.role ?? '') &&
    request.nextUrl.pathname !== '/maintenance'
  ) {
    return NextResponse.redirect(new URL('/maintenance', request.url))
  }

  // Super admin only routes
  const superAdminRoutes = [
    '/admin/revenue',
    '/admin/admins',
    '/admin/settings',
    '/admin/analytics',
    '/admin/export',
    '/admin/audit',
  ]

  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!["admin", "super_admin"].includes(profile?.role ?? "")) {
      return NextResponse.redirect(new URL("/", request.url))
    }

    if (superAdminRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
      if (profile?.role !== 'super_admin') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
    }
  }

  if (
    request.nextUrl.pathname.startsWith("/landlord") &&
    !["landlord", "admin", "super_admin"].includes(profile?.role ?? "")
  ) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return response
}

export const config = {
  matcher: ["/landlord/:path*", "/admin/:path*", "/maintenance"]
}
