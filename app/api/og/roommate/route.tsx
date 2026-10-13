import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import sharp from "sharp"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return new Response("Missing roommate profile ID", { status: 400 })
  }

  try {
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey
    )

    // Fetch roommate profile
    const { data: roommate } = await supabase
      .from("roommate_profiles")
      .select("intent, university, budget_min, budget_max, gender, user_id")
      .eq("id", id)
      .eq("status", "active")
      .single()

    // Fetch linked user profile
    let userProfile: {
      full_name: string | null
      avatar_url: string | null
      verification_status: string | null
    } | null = null

    if (roommate?.user_id) {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, verification_status")
        .eq("id", roommate.user_id)
        .single()
      userProfile = data
    }

    // Build display values with safe fallbacks
    const displayName = userProfile?.full_name || "Student"
    const name = displayName
    const university = roommate?.university || "University"
    const isVerified = userProfile?.verification_status === "verified"
    const initial = displayName.charAt(0).toUpperCase()

    const budgetText =
      roommate?.budget_min && roommate?.budget_max
        ? `${Number(roommate.budget_min).toLocaleString("en-NG")} - ${Number(roommate.budget_max).toLocaleString("en-NG")}/yr`
        : "Flexible Budget"

    const intentLabel =
      roommate?.intent === "have_room" ? "Has a Room" : "Looking for a Room"

    // Fetch and convert avatar to PNG base64 via sharp (Satori does not support WebP)
    let avatarBase64: string | null = null
    if (userProfile?.avatar_url) {
      try {
        const res = await fetch(userProfile.avatar_url)
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer()
          const inputBuffer = Buffer.from(arrayBuffer)
          const pngBuffer = await sharp(inputBuffer)
            .resize(360, 360, { fit: "cover" })
            .png()
            .toBuffer()
          avatarBase64 = `data:image/png;base64,${pngBuffer.toString("base64")}`
        }
      } catch {
        avatarBase64 = null
      }
    }

    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#F9FAFB",
            padding: "60px 80px",
          }}
        >
          {/* Top Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* Brand */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: "#1B4332",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "28px",
                  fontWeight: 900,
                }}
              >
                H
              </div>
              <span
                style={{
                  fontSize: "32px",
                  fontWeight: 800,
                  color: "#1B4332",
                }}
              >
                HousePlug
              </span>
            </div>

            {/* Verified Badge */}
            {isVerified && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: "#DCFCE7",
                  color: "#15803D",
                  fontSize: "20px",
                  fontWeight: 700,
                  padding: "10px 20px",
                  borderRadius: "999px",
                }}
              >
                Verified Student
              </div>
            )}
          </div>

          {/* Center Section */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "48px",
              flex: 1,
              paddingTop: "20px",
              paddingBottom: "20px",
            }}
          >
            {/* Avatar */}
            {avatarBase64 ? (
              <img
                src={avatarBase64}
                alt={name}
                style={{
                  width: "180px",
                  height: "180px",
                  borderRadius: "999px",
                  objectFit: "cover",
                  border: "6px solid #1B4332",
                }}
              />
            ) : (
              <div
                style={{
                  width: "180px",
                  height: "180px",
                  borderRadius: "999px",
                  border: "6px solid #1B4332",
                  backgroundColor: "#E5E7EB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "72px",
                  fontWeight: 800,
                  color: "#9CA3AF",
                }}
              >
                {initial}
              </div>
            )}

            {/* Profile Info */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                flex: 1,
              }}
            >
              <div
                style={{
                  fontSize: "46px",
                  fontWeight: 900,
                  color: "#111827",
                  lineHeight: 1.1,
                }}
              >
                {displayName}
              </div>
              <div
                style={{
                  fontSize: "26px",
                  fontWeight: 600,
                  color: "#4B5563",
                }}
              >
                {university}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  alignItems: "center",
                  marginTop: "8px",
                }}
              >
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 800,
                    color: "white",
                    backgroundColor: "#1B4332",
                    padding: "8px 24px",
                    borderRadius: "12px",
                  }}
                >
                  {budgetText}
                </div>
                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: 700,
                    color:
                      roommate?.intent === "have_room" ? "#B45309" : "#1B4332",
                    backgroundColor:
                      roommate?.intent === "have_room" ? "#FEF3C7" : "#DCFCE7",
                    padding: "8px 20px",
                    borderRadius: "12px",
                  }}
                >
                  {intentLabel}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "2px solid #E5E7EB",
              paddingTop: "24px",
            }}
          >
            <span style={{ fontSize: "22px", color: "#6B7280" }}>
              houseplug.ng/roommates
            </span>
            <span style={{ fontSize: "22px", color: "#6B7280" }}>
              Connect and Team Up on Campus
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )

    // Set CDN cache headers
    imageResponse.headers.set(
      "Cache-Control",
      "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400"
    )

    return imageResponse
  } catch {
    // Fallback: render a minimal branded card on any unhandled error
    try {
      return new ImageResponse(
        (
          <div
            style={{
              width: "1200px",
              height: "630px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#1B4332",
              gap: "24px",
            }}
          >
            <div
              style={{
                fontSize: "64px",
                fontWeight: 900,
                color: "white",
              }}
            >
              HousePlug
            </div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: 600,
                color: "#D1D5DB",
              }}
            >
              Student Housing - Find Your Perfect Roommate
            </div>
          </div>
        ),
        { width: 1200, height: 630 }
      )
    } catch {
      return new Response("Failed to generate image", { status: 500 })
    }
  }
}
