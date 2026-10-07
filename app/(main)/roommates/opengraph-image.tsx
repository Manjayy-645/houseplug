import { ImageResponse } from "next/og"

export const runtime = "edge"

export const alt = "HousePlug Roommates"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default function Image() {
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
        
        <div style={{ zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "32px", marginBottom: "40px" }}>
          <div style={{ background: "#F59E0B", color: "#1B4332", padding: "16px 32px", borderRadius: "24px", fontSize: 80, fontWeight: 900 }}>HP</div>
          <div style={{ fontSize: 80, fontWeight: 900, letterSpacing: "-0.05em", color: "white" }}>HousePlug</div>
        </div>

        <div style={{ zIndex: 1, fontSize: 48, fontWeight: 700, color: "#F59E0B", textAlign: "center" }}>
          Find your perfect roommate
        </div>
        
        <div style={{ zIndex: 1, display: "flex", marginTop: "auto", fontSize: 24, fontWeight: 500, color: "rgba(255,255,255,0.7)" }}>
          houseplug.ng
        </div>
      </div>
    ),
    { ...size }
  )
}
