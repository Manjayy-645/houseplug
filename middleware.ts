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

  if (request.nextUrl.pathname.startsWith("/admin") && profile?.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (
    request.nextUrl.pathname.startsWith("/landlord") &&
    profile?.role !== "landlord" &&
    profile?.role !== "admin"
  ) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return response
}

export const config = {
  matcher: ["/landlord/:path*", "/admin/:path*"]
}
