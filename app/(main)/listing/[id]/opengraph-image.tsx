import { ImageResponse } from "next/og"
import { createClient } from "@/lib/supabase/server"
import { formatNaira } from "@/lib/utils"

export const runtime = "nodejs"

type OpengraphImageProps = {
  params: { id: string }
}

export default async function OpengraphImage({ params }: OpengraphImageProps) {
  const supabase = createClient()
  const { data } = await supabase
    .from("listings")
    .select("title, price_yearly, status")
    .eq("id", params.id)
    .single()

  const title = data?.title ?? "HousePlug Listing"
  const price = typeof data?.price_yearly === "number" ? data.price_yearly : 0

  const safeTitle = title.length > 56 ? `${title.slice(0, 56)}…` : title

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#F9FAFB",
          display: "flex",
          flexDirection: "column",
          padding: 64,
          fontFamily: "Arial, sans-serif"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: "#1B4332",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800
            }}
          >
            HP
          </div>
          <div style={{ fontSize: 40, fontWeight: 900, color: "#1B4332" }}>HousePlug</div>
        </div>

        <div style={{ marginTop: 36, maxWidth: 980 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#111827" }}>{safeTitle}</div>
          <div style={{ marginTop: 12, fontSize: 30, fontWeight: 900, color: "#1B4332" }}>
            {formatNaira(price)} <span style={{ fontSize: 16, fontWeight: 700, color: "#374151" }}>/ year</span>
          </div>
        </div>

        <div
          style={{
            marginTop: "auto",
            paddingTop: 36,
            borderTop: "2px solid rgba(27,67,50,0.18)",
            fontSize: 22,
            fontWeight: 700,
            color: "#1B4332"
          }}
        >
          Find student housing in Port Harcourt — houseplug.ng
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}

