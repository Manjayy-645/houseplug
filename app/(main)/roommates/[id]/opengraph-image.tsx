import { ImageResponse } from "next/og"
import { createServiceClient } from "@/lib/supabase/server"

export const runtime = "edge"
export const alt = "HousePlug Roommate Profile"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default async function Image({ params }: { params: { id: string } }) {
  const supabase = createServiceClient()

  try {
    const { data: roommate } = await supabase
      .from("roommate_profiles")
      .select("intent, university, user_id, gender, budget_min, budget_max")
      .eq("id", params.id)
      .eq("status", "active")
      .single()

    if (!roommate) {
      throw new Error("Profile not found")
    }

    // Fetch the user's profile for avatar and name
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", roommate.user_id)
      .single()

    const firstName = userProfile?.full_name?.split(" ")[0] || "A Student"
    const avatarUrl = userProfile?.avatar_url || null

    // Pre-fetch avatar image to ensure it renders in the OG image
    let avatarSrc: string | null = null
    if (avatarUrl) {
      try {
        const res = await fetch(avatarUrl)
        if (res.ok) {
          const buffer = await res.arrayBuffer()
          const base64 = Buffer.from(buffer).toString("base64")
          const contentType = res.headers.get("content-type") || "image/jpeg"
          avatarSrc = `data:${contentType};base64,${base64}`
        }
      } catch {
        // Avatar fetch failed — we'll show initials instead
      }
    }

    const initials = firstName.charAt(0).toUpperCase()

    const ctaText = roommate.intent === "have_room"
      ? `${firstName} has a room — wanna move in?`
      : `${firstName} needs a roommate — wanna team up?`

    const budgetText = `₦${roommate.budget_min.toLocaleString("en-NG")} – ₦${roommate.budget_max.toLocaleString("en-NG")}/yr`

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#1B4332",
            color: "white",
            fontFamily: "sans-serif",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background glow */}
          <div
            style={{
              position: "absolute",
              top: "-30%",
              right: "-10%",
              width: "70%",
              height: "100%",
              background: "radial-gradient(circle, rgba(245,158,11,0.2) 0%, rgba(27,67,50,0) 70%)",
            }}
          />

          {/* Top bar with logo */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "40px 60px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ background: "#F59E0B", color: "#1B4332", padding: "6px 14px", borderRadius: "10px", fontSize: 28, fontWeight: 900 }}>HP</div>
              <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>HousePlug</span>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: roommate.intent === "have_room" ? "#F59E0B" : "rgba(255,255,255,0.15)",
              padding: "8px 20px",
              borderRadius: "50px",
              fontSize: 16,
              fontWeight: 800,
              textTransform: "uppercase" as const,
              letterSpacing: "0.1em",
            }}>
              {roommate.intent === "have_room" ? "Has a Room" : "Teaming Up"}
            </div>
          </div>

          {/* Main content */}
          <div style={{ display: "flex", flex: 1, alignItems: "center", padding: "0 60px", gap: "50px" }}>
            {/* Avatar section */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
              <div style={{
                width: "180px",
                height: "180px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "4px solid rgba(245,158,11,0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: avatarSrc ? "transparent" : "#2D6A4F",
                flexShrink: 0,
              }}>
                {avatarSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarSrc}
                    width={180}
                    height={180}
                    style={{ objectFit: "cover", width: "100%", height: "100%" }}
                    alt=""
                  />
                ) : (
                  <span style={{ fontSize: 72, fontWeight: 900, color: "#F59E0B" }}>{initials}</span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: 18, color: "rgba(255,255,255,0.7)" }}>
                {roommate.gender} | {roommate.university}
              </div>
            </div>

            {/* Text section */}
            <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: "20px" }}>
              <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.15, color: "white", letterSpacing: "-0.02em" }}>
                {ctaText}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{
                  background: "rgba(245,158,11,0.15)",
                  border: "2px solid rgba(245,158,11,0.3)",
                  borderRadius: "16px",
                  padding: "12px 24px",
                  display: "flex",
                  flexDirection: "column",
                }}>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>Budget</span>
                  <span style={{ fontSize: 24, fontWeight: 900, color: "#F59E0B" }}>{budgetText}</span>
                </div>
              </div>
              <div style={{ fontSize: 20, color: "#F59E0B", fontWeight: 700, marginTop: "8px" }}>
                View {firstName}&apos;s full profile on houseplug.ng
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ display: "flex", justifyContent: "center", padding: "0 60px 32px", fontSize: 18, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>
            houseplug.ng — Your trusted housing plug
          </div>
        </div>
      ),
      { ...size }
    )
  } catch {
    // Fallback image
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#1B4332",
            color: "white",
            padding: "80px",
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
            <div style={{ background: "#F59E0B", color: "#1B4332", padding: "16px 32px", borderRadius: "24px", fontSize: 80, fontWeight: 900 }}>HP</div>
            <div style={{ fontSize: 80, fontWeight: 900, letterSpacing: "-0.05em" }}>HousePlug</div>
            <div style={{ fontSize: 36, color: "#F59E0B", marginTop: "16px", fontWeight: 500 }}>Your trusted housing plug</div>
          </div>
        </div>
      ),
      { ...size }
    )
  }
}
