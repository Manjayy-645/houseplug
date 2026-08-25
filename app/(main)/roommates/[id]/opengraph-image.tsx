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
      .select("intent, university")
      .eq("id", params.id)
      .eq("status", "active")
      .single()

    if (!roommate) {
      throw new Error("Profile not found")
    }

    const intentText = roommate.intent === "have_room" 
      ? "Has a room, looking for a roommate" 
      : "Looking to team up for a room"

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
            position: "relative",
          }}
        >
          {/* subtle pattern/glow */}
          <div
            style={{
              position: "absolute",
              top: "-50%",
              left: "-10%",
              width: "120%",
              height: "120%",
              background: "radial-gradient(circle, rgba(245,158,11,0.15) 0%, rgba(27,67,50,0) 70%)",
              zIndex: 0,
            }}
          />
          
          {/* Logo Mark */}
          <div style={{ zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "auto" }}>
            <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: "-0.05em", display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ background: "#F59E0B", color: "#1B4332", padding: "8px 16px", borderRadius: "12px" }}>HP</div>
              <span>HousePlug</span>
            </div>
          </div>

          <div style={{ zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: "80px" }}>
            <div style={{ fontSize: 72, fontWeight: 900, marginBottom: "24px", color: "white", lineHeight: 1.1 }}>
              {intentText}
            </div>
            <div style={{ fontSize: 48, fontWeight: 700, color: "#F59E0B" }}>
              Near {roommate.university}
            </div>
          </div>
          
          <div style={{ zIndex: 1, display: "flex", marginTop: "auto", fontSize: 24, fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>
            houseplug.ng
          </div>
        </div>
      ),
      { ...size }
    )
  } catch (error) {
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
