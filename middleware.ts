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
    try {
      const { data: maintenance } = await supabase
        .from("platform_settings")
        .select("value")
        .eq("key", "maintenance_mode")
        .maybeSingle()

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
    } catch {
      // If the maintenance check fails (DB timeout, table missing, etc.),
      // let the request through rather than crashing the entire page.
    }
  }

  // --- Refresh auth session on every request --------------------------------
  // This ensures tokens stay fresh even on public pages. Without this, users
  // browsing public pages accumulate stale sessions and get unexpected
  // redirects to /login when they navigate to a protected route.
  await supabase.auth.getUser()

  // --- Auth + role gating (protected areas only) ---------------------------
  // Determine which landlord sub-paths are actually the private dashboard.
  // /landlord/[username] is a PUBLIC profile page and must NOT be gated.
  const landlordProtectedPrefixes = [
    "/landlord/dashboard",
    "/landlord/listings",
    "/landlord/analytics",
    "/landlord/billing",
    "/landlord/profile",
    "/landlord/reviews",
    "/landlord/subscription",
    "/landlord/verification",
    "/landlord/loading",
  ]
  const isLandlordProtected =
    path === "/landlord" ||
    landlordProtectedPrefixes.some(prefix => path.startsWith(prefix))

  const isProtected = isLandlordProtected || path.startsWith("/admin")
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
    isLandlordProtected &&
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
