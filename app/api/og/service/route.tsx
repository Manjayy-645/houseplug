import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import sharp from "sharp"
import { formatServicePrice, getCategoryLabel } from "@/lib/service-utils"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return new Response("Missing service ID", { status: 400 })
  }

  try {
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey
    )

    // Fetch service provider
    const { data: service } = await supabase
      .from("service_providers")
      .select("*")
      .eq("id", id)
      .single()

    const businessName = service?.business_name || "Campus Service"
    const categoryLabel = getCategoryLabel(service?.category)
    const university = service?.university || "Port Harcourt"
    const isVerified = !!service?.is_verified
    const isStudentOwned = !!service?.is_student_owned
    const vouchCount = service?.vouch_count || 0
    const initial = businessName.charAt(0).toUpperCase()
    const formattedPrice = formatServicePrice(
      service?.pricing_type,
      service?.price_amount,
      service?.price_unit
    )

    // Convert image buffer to 220x220 PNG base64 via sharp for Satori compatibility
    let imageBase64: string | null = null
    if (service?.image_url) {
      try {
        const res = await fetch(service.image_url)
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer()
          const inputBuffer = Buffer.from(arrayBuffer)
          const pngBuffer = await sharp(inputBuffer)
            .resize(220, 220, { fit: "cover" })
            .png()
            .toBuffer()
          imageBase64 = `data:image/png;base64,${pngBuffer.toString("base64")}`
        }
      } catch {
        imageBase64 = null
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
            padding: "50px 70px",
            fontFamily: "sans-serif",
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
            {/* HousePlug Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  backgroundColor: "#1B4332",
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "30px",
                  fontWeight: 900,
                }}
              >
                H
              </div>
              <span
                style={{
                  fontSize: "34px",
                  fontWeight: 800,
                  color: "#1B4332",
                  letterSpacing: "-0.5px",
                }}
              >
                HousePlug
              </span>
            </div>

            {/* Badges / Pill */}
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              {isVerified && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "#DCFCE7",
                    color: "#15803D",
                    fontSize: "20px",
                    fontWeight: 700,
                    padding: "8px 20px",
                    borderRadius: "999px",
                    border: "1px solid #BBF7D0",
                  }}
                >
                  Verified Campus Service
                </div>
              )}
              {isStudentOwned && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "#FEF3C7",
                    color: "#B45309",
                    fontSize: "20px",
                    fontWeight: 700,
                    padding: "8px 20px",
                    borderRadius: "999px",
                    border: "1px solid #FDE68A",
                  }}
                >
                  Student-Owned Business
                </div>
              )}
              {!isVerified && !isStudentOwned && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "#E0E7FF",
                    color: "#3730A3",
                    fontSize: "20px",
                    fontWeight: 700,
                    padding: "8px 20px",
                    borderRadius: "999px",
                  }}
                >
                  Campus Service
                </div>
              )}
            </div>
          </div>

          {/* Center Content Section */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "44px",
              flex: 1,
              paddingTop: "20px",
              paddingBottom: "20px",
            }}
          >
            {/* Service Image / Initial Box */}
            {imageBase64 ? (
              <img
                src={imageBase64}
                alt={businessName}
                style={{
                  width: "220px",
                  height: "220px",
                  borderRadius: "28px",
                  objectFit: "cover",
                  border: "5px solid #1B4332",
                }}
              />
            ) : (
              <div
                style={{
                  width: "220px",
                  height: "220px",
                  borderRadius: "28px",
                  backgroundColor: "#1B4332",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#F59E0B",
                  fontSize: "96px",
                  fontWeight: 900,
                  boxShadow: "0 10px 25px -5px rgba(27, 67, 50, 0.3)",
                }}
              >
                {initial}
              </div>
            )}

            {/* Info Container */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                flex: 1,
              }}
            >
              <div
                style={{
                  fontSize: "44px",
                  fontWeight: 900,
                  color: "#111827",
                  lineHeight: 1.15,
                  maxWidth: "760px",
                }}
              >
                {businessName}
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: 600,
                  color: "#4B5563",
                }}
              >
                {categoryLabel} • {university}
              </div>

              {/* Price Tag Badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "#1B4332",
                  color: "white",
                  fontSize: "26px",
                  fontWeight: 800,
                  padding: "10px 26px",
                  borderRadius: "16px",
                  width: "fit-content",
                  marginTop: "8px",
                  boxShadow: "0 4px 12px rgba(27, 67, 50, 0.2)",
                }}
              >
                {formattedPrice}
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
              paddingTop: "20px",
            }}
          >
            <span
              style={{
                fontSize: "22px",
                color: "#4B5563",
                fontWeight: 600,
              }}
            >
              houseplug.ng/services
            </span>
            <span
              style={{
                fontSize: "22px",
                color: "#1B4332",
                fontWeight: 700,
              }}
            >
              👍 {vouchCount} {vouchCount === 1 ? "Student Vouch" : "Student Vouches"}
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )

    imageResponse.headers.set(
      "Cache-Control",
      "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400"
    )

    return imageResponse
  } catch (err) {
    console.error("OG generator error:", err)
    // Fallback card
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
            gap: "20px",
            fontFamily: "sans-serif",
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
              color: "#F59E0B",
            }}
          >
            Verified Campus Services & Housing in Port Harcourt
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    )
  }
}
