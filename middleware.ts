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

  const path = request.nextUrl.pathname

  // --- Site-wide maintenance gate ------------------------------------------
  // Applies to everyone, including logged-out visitors. Admins bypass it, and a
  // few routes stay open so an admin can still log in and turn it back off.
  const maintenanceExempt =
    path === "/maintenance" ||
    path.startsWith("/login") ||
    path.startsWith("/auth")

  if (!maintenanceExempt) {
    const { data: maintenance } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", "maintenance_mode")
      .single()

    if (maintenance?.value === "true" || maintenance?.value === true) {
      // Only fetch the user/role when we actually need to decide who bypasses.
      const { data: { user } } = await supabase.auth.getUser()
      let isAdmin = false
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()
        isAdmin = ["admin", "super_admin"].includes(profile?.role ?? "")
      }
      if (!isAdmin) {
        return NextResponse.redirect(new URL("/maintenance", request.url))
      }
    }
  }

  // --- Auth + role gating (protected areas only) ---------------------------
  // Public routes are done once the maintenance gate passes; avoid the extra
  // auth/profile lookups on them.
  const isProtected = path.startsWith("/landlord") || path.startsWith("/admin")
  if (!isProtected) return response

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
    if (path !== "/banned" && path !== "/appeal" && !path.startsWith("/api/")) {
      return NextResponse.redirect(new URL("/banned", request.url))
    }
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

  if (path.startsWith("/admin")) {
    if (!["admin", "super_admin"].includes(profile?.role ?? "")) {
      return NextResponse.redirect(new URL("/", request.url))
    }

    if (superAdminRoutes.some(route => path.startsWith(route))) {
      if (profile?.role !== 'super_admin') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
    }
  }

  if (
    path.startsWith("/landlord") &&
    !["landlord", "agent", "admin", "super_admin"].includes(profile?.role ?? "")
  ) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return response
}

export const config = {
  // Run on every page except Next internals, API routes, and static files, so
  // the maintenance gate can cover the whole public site.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"]
}
