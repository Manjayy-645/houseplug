import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  if (
    /^\/listing\/[^/]+$/.test(request.nextUrl.pathname) &&
    !/^\/listing\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      request.nextUrl.pathname,
    )
  ) {
    return new NextResponse(
      '<html lang="en"><title>Room not found | HousePlug</title><meta name="robots" content="noindex"><body><h1>Room not found</h1><a href="/browse">Browse available rooms</a></body></html>',
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
      global: {
        fetch: (url, init) => {
          return fetch(url, {
            ...init,
            cache: "no-store",
          });
        },
      },
    },
  );

  const path = request.nextUrl.pathname;

  // --- Developer Bypass Check (Cookie or Query Param) -----------------------
  // A configured private bypass secret sets an HTTP-only cookie so developers
  // can test guest, student, and landlord flows without hitting /maintenance.
  // Visiting with ?dev_bypass=clear removes the bypass.
  const DEV_SECRET = process.env.DEV_BYPASS_SECRET;
  const devParam =
    request.nextUrl.searchParams.get("dev_bypass") ||
    request.nextUrl.searchParams.get("dev_secret");
  let hasDevBypass = Boolean(
    DEV_SECRET && request.cookies.get("hp_dev_bypass")?.value === DEV_SECRET,
  );

  if (DEV_SECRET && devParam === DEV_SECRET) {
    hasDevBypass = true;
    response.cookies.set("hp_dev_bypass", DEV_SECRET, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
    });
  } else if (devParam === "clear" || devParam === "off") {
    hasDevBypass = false;
    response.cookies.delete("hp_dev_bypass");
  }

  // --- Site-wide maintenance gate ------------------------------------------
  // Applies to everyone, including logged-out visitors. Admins & Devs bypass it.
  // /maintenance, /login, and /auth stay open so devs/admins can log in.
  const maintenanceExempt =
    path === "/maintenance" ||
    path.startsWith("/login") ||
    path.startsWith("/auth");

  if (!maintenanceExempt) {
    let isMaintenance = process.env.MAINTENANCE_MODE === "true";

    if (!isMaintenance) {
      try {
        const { data: maintenance } = await supabase
          .from("platform_settings")
          .select("value")
          .eq("key", "maintenance_mode")
          .maybeSingle();

        if (maintenance) {
          const val = maintenance.value;
          isMaintenance =
            val === true ||
            val === "true" ||
            val === '"true"' ||
            String(val).toLowerCase().trim() === "true" ||
            String(val).toLowerCase().trim() === '"true"';
        }
      } catch (err) {
        console.error("[MIDDLEWARE] Error checking maintenance mode:", err);
      }
    }

    if (isMaintenance) {
      // Check if caller can bypass (Dev cookie or Admin/SuperAdmin role)
      let canBypass = hasDevBypass;

      if (!canBypass) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
          canBypass = ["admin", "super_admin"].includes(profile?.role ?? "");
        }
      }

      if (!canBypass) {
        return NextResponse.redirect(new URL("/maintenance", request.url));
      }

      // Signal that maintenance mode is active so pages/layouts can display an indicator
      response.headers.set("x-maintenance-mode", "active");
    }
  }

  // --- Refresh auth session on every request --------------------------------
  // This ensures tokens stay fresh even on public pages. Without this, users
  // browsing public pages accumulate stale sessions and get unexpected
  // redirects to /login when they navigate to a protected route.
  await supabase.auth.getUser();

  // --- Auth + role gating (protected areas only) ---------------------------
  // Determine which landlord sub-paths are actually the private dashboard.
  // /landlord/[username] is a PUBLIC profile page and must NOT be gated.
  const landlordProtectedPrefixes = [
    "/landlord/dashboard",
    "/landlord/requests",
    "/landlord/listings",
    "/landlord/analytics",
    "/landlord/billing",
    "/landlord/profile",
    "/landlord/reviews",
    "/landlord/subscription",
    "/landlord/verification",
    "/landlord/loading",
  ];
  const isLandlordProtected =
    path === "/landlord" ||
    landlordProtectedPrefixes.some((prefix) => path.startsWith(prefix));

  const isProtected = isLandlordProtected || path.startsWith("/admin");
  if (!isProtected) return response;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, banned,is_banned")
    .eq("id", user.id)
    .single();

  if (profile?.banned || profile?.is_banned) {
    if (path !== "/banned" && path !== "/appeal" && !path.startsWith("/api/")) {
      return NextResponse.redirect(new URL("/banned", request.url));
    }
  }

  // Super admin only routes
  const superAdminRoutes = [
    "/admin/revenue",
    "/admin/admins",
    "/admin/settings",
    "/admin/analytics",
    "/admin/export",
    "/admin/audit",
  ];

  if (path.startsWith("/admin")) {
    if (!["admin", "super_admin"].includes(profile?.role ?? "")) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (superAdminRoutes.some((route) => path.startsWith(route))) {
      if (profile?.role !== "super_admin") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }
  }

  if (
    isLandlordProtected &&
    !["landlord", "agent", "admin", "super_admin"].includes(profile?.role ?? "")
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  // Run on every page except Next internals, API routes, and static files, so
  // the maintenance gate can cover the whole public site.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
