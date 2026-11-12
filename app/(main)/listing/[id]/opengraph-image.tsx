import { ImageResponse } from "next/og"
import { createClient } from "@/lib/supabase/server"
import { formatRoomType } from "@/lib/utils"

export const runtime = "edge"

type OpengraphImageProps = {
  params: { id: string }
}

export default async function OpengraphImage({ params }: OpengraphImageProps) {
  const supabase = createClient()
  
  // Safe UUID check to prevent bad requests
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id)
  
  let data = null

  if (isUuid) {
    const { data: listingData } = await supabase
      .from("listings")
      .select(`
        *,
        landlord:profiles!landlord_id(verification_status),
        reviews(rating)
      `)
      .eq("id", params.id)
      .single()
      
    data = listingData
  }

  if (!data) {
    return new Response("Not Found", { status: 404 })
  }

  const roomTypeStr = formatRoomType(data.room_type)
  const formattedPriceRaw = new Intl.NumberFormat("en-NG").format(data.price_yearly)

  const reviews = data.reviews || []
  const reviewCount = reviews.length
  const averageRating = reviewCount > 0 
    ? (reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / reviewCount).toFixed(1)
    : null

  const bgPhoto = (data.photos && data.photos.length > 0) 
    ? data.photos[0] 
    : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1200"

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Arial, sans-serif",
          backgroundColor: "#0F1F17",
          color: "white"
        }}
      >
        {/* Top half: Photo with dark gradient overlay */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={bgPhoto} 
            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
            alt="Property background" 
          />
          {/* Gradient Overlay */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: "linear-gradient(to bottom, rgba(15,31,23,0.3) 0%, rgba(15,31,23,0.9) 70%, rgba(15,31,23,1) 100%)"
          }} />
        </div>

        {/* Content Container */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: 64,
          position: "relative",
          zIndex: 10
        }}>
          {/* Top Row: Logo & Verified Badge */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: "#1B7A4D",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  fontWeight: 800
                }}
              >
                HP
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "white" }}>HousePlug</div>
            </div>
            
            <div style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#1B7A4D",
              padding: "8px 16px",
              borderRadius: 24,
              fontWeight: 700,
              fontSize: 20,
              color: "white"
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              Verified Listing
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", width: "100%" }}>
            {reviewCount > 0 && (
              <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 28, color: "#E8A317", marginRight: 8 }}>⭐</span>
                <span style={{ fontSize: 24, fontWeight: 700, color: "white" }}>{averageRating}</span>
                <span style={{ fontSize: 24, fontWeight: 500, color: "#9CA3AF", marginLeft: 8 }}>· {reviewCount} review{reviewCount !== 1 ? 's' : ''}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", width: "100%" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, paddingRight: 24 }}>
                <div style={{ fontSize: 56, fontWeight: 800, color: "white", lineHeight: 1.1, wordWrap: "break-word" }}>
                  {data.title.length > 56 ? `${data.title.slice(0, 56)}...` : data.title}
                </div>
                <div style={{ fontSize: 32, fontWeight: 600, color: "#E5E7EB" }}>
                  {roomTypeStr} · {data.area}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
                <div style={{ fontSize: 48, fontWeight: 900, color: "#1B7A4D" }}>
                  ₦{formattedPriceRaw}
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#9CA3AF" }}>
                  / year
                </div>
              </div>
            </div>
          </div>
          
          <div style={{
            position: "absolute",
            bottom: 24,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 700,
            color: "rgba(255,255,255,0.5)"
          }}>
            houseplug.ng
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}

