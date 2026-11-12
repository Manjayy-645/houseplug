import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "60px 80px",
        backgroundColor: "#1B4332",
        color: "white",
        fontFamily: "sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background decorative glow */}
      <div
        style={{
          position: "absolute",
          top: -120,
          right: -120,
          width: 450,
          height: 450,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(245,158,11,0.25) 0%, rgba(27,67,50,0) 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -150,
          left: -100,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(16,185,129,0.2) 0%, rgba(27,67,50,0) 70%)",
        }}
      />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              backgroundColor: "#F59E0B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: 28,
              color: "#111827",
            }}
          >
            H
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{ fontSize: 32, fontWeight: 900, letterSpacing: -0.5 }}
            >
              HousePlug<span style={{ color: "#F59E0B" }}>.ng</span>
            </span>
            <span style={{ fontSize: 14, color: "#A7F3D0", fontWeight: 600 }}>
              Verified Student Housing
            </span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: "rgba(255,255,255,0.12)",
            padding: "10px 20px",
            borderRadius: 30,
            fontSize: 16,
            fontWeight: 700,
            border: "1px solid rgba(255,255,255,0.2)",
          }}
        >
          Compare Rooms & Costs
        </div>
      </div>

      {/* Main Pitch */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          zIndex: 1,
          maxWidth: 960,
        }}
      >
        <div
          style={{
            fontSize: 54,
            fontWeight: 900,
            lineHeight: 1.15,
            letterSpacing: -1,
          }}
        >
          Find Verified Student Housing Near Your Campus
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#E5E7EB",
            lineHeight: 1.4,
            fontWeight: 400,
          }}
        >
          Self-cons, single rooms, apartments & flatshares near UniPort, RSU,
          IAUE, and KenPoly. Direct contact with verified landlords on WhatsApp.
        </div>
      </div>

      {/* Campuses & Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid rgba(255,255,255,0.15)",
          paddingTop: 24,
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span
            style={{
              fontSize: 14,
              color: "#9CA3AF",
              textTransform: "uppercase",
              letterSpacing: 1,
              fontWeight: 700,
            }}
          >
            Campuses:
          </span>
          {[
            "UniPort (Choba)",
            "RSU (Nkpolu)",
            "IAUE (Rumuola)",
            "KenPoly (Bori)",
          ].map((campus) => (
            <span
              key={campus}
              style={{
                fontSize: 14,
                backgroundColor: "rgba(255,255,255,0.08)",
                padding: "6px 14px",
                borderRadius: 16,
                color: "#F3F4F6",
                fontWeight: 600,
              }}
            >
              {campus}
            </span>
          ))}
        </div>

        <span style={{ fontSize: 18, fontWeight: 800, color: "#F59E0B" }}>
          houseplug.ng
        </span>
      </div>
    </div>,
    { ...size },
  );
}
