import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import sharp, { type Sharp } from "sharp";
import fs from "fs";
import path from "path";
import { formatRoomType } from "@/lib/utils";
import { UNIVERSITIES } from "@/lib/constants";
import { getVideoPosterUrl } from "@/lib/cloudinary";

export const runtime = "nodejs";

function escapeXml(unsafe: unknown): string {
  return String(unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getFallbackImageResponse(): Response {
  try {
    const fallbackPath = path.join(process.cwd(), "public", "icons", "og-default.jpg");
    const fallbackBuf = fs.readFileSync(fallbackPath);
    return new Response(fallbackBuf, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch {
    return new Response("Fallback image not found", { status: 500 });
  }
}

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  const isUuid =
    id &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  if (!isUuid) {
    return getFallbackImageResponse();
  }

  try {
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !supabaseKey) {
      return getFallbackImageResponse();
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey,
    );

    const { data: listing, error } = await supabase
      .from("listings")
      .select("id, title, price_yearly, room_type, area, university, photos, video_url")
      .eq("id", id)
      .single();

    if (error || !listing) {
      return getFallbackImageResponse();
    }

    const campus =
      UNIVERSITIES.find((u) => u.id === listing.university)?.shortName ||
      listing.university ||
      "Campus";
    const roomTypeStr = formatRoomType(listing.room_type);
    const formattedPrice = new Intl.NumberFormat("en-NG").format(
      listing.price_yearly || 0,
    );

    let photoUrl: string | null = null;
    if (listing.photos && Array.isArray(listing.photos) && listing.photos.length > 0) {
      photoUrl = listing.photos[0];
    } else if (listing.video_url) {
      photoUrl = getVideoPosterUrl(listing.video_url, 1200);
    }

    let photoBuffer: Buffer | null = null;
    if (photoUrl) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(photoUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          photoBuffer = Buffer.from(arrayBuffer);
        }
      } catch {
        photoBuffer = null;
      }
    }

    const width = 1200;
    const height = 630;

    let baseSharp: Sharp;
    if (photoBuffer) {
      try {
        baseSharp = sharp(photoBuffer).resize(width, height, {
          fit: "cover",
          position: "center",
        });
      } catch {
        baseSharp = sharp({
          create: {
            width,
            height,
            channels: 3,
            background: { r: 27, g: 67, b: 50 }, // #1B4332
          },
        });
      }
    } else {
      baseSharp = sharp({
        create: {
          width,
          height,
          channels: 3,
          background: { r: 27, g: 67, b: 50 }, // #1B4332
        },
      });
    }

    const rawTitle = listing.title || `${roomTypeStr} in ${listing.area}`;
    const safeTitle = escapeXml(
      rawTitle.length > 50 ? rawTitle.slice(0, 50) + "..." : rawTitle,
    );
    const safeArea = escapeXml(listing.area || "Port Harcourt");
    const safeCampus = escapeXml(campus);
    const safeRoomType = escapeXml(roomTypeStr);

    const overlaySvg = Buffer.from(`
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="topShadow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0F1F17" stop-opacity="0.8" />
            <stop offset="100%" stop-color="#0F1F17" stop-opacity="0" />
          </linearGradient>
          <linearGradient id="bottomShadow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0F1F17" stop-opacity="0" />
            <stop offset="35%" stop-color="#0F1F17" stop-opacity="0.7" />
            <stop offset="100%" stop-color="#0F1F17" stop-opacity="0.95" />
          </linearGradient>
        </defs>

        <!-- Top Vignette -->
        <rect x="0" y="0" width="${width}" height="180" fill="url(#topShadow)" />

        <!-- Bottom Gradient -->
        <rect x="0" y="220" width="${width}" height="410" fill="url(#bottomShadow)" />

        <!-- Top Bar: Brand Pill -->
        <g transform="translate(60, 48)">
          <rect x="0" y="0" width="220" height="48" rx="24" fill="#1B4332" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" />
          <circle cx="26" cy="24" r="10" fill="#F59E0B" />
          <text x="26" y="28.5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="12" font-weight="900" fill="#111827" text-anchor="middle">H</text>
          <text x="50" y="31" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="20" font-weight="800" fill="#FFFFFF">HousePlug<tspan fill="#F59E0B">.ng</tspan></text>
        </g>

        <!-- Top Bar: Campus Badge -->
        <g transform="translate(900, 48)">
          <rect x="0" y="0" width="240" height="48" rx="24" fill="rgba(15,31,23,0.85)" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" />
          <text x="120" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="16" font-weight="700" fill="#A7F3D0" text-anchor="middle">📍 ${safeCampus}</text>
        </g>

        <!-- Bottom Content -->
        <text x="60" y="465" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="44" font-weight="900" fill="#FFFFFF">${safeTitle}</text>
        
        <g transform="translate(60, 490)">
          <text x="0" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="24" font-weight="600" fill="#E5E7EB">${safeRoomType} · ${safeArea} · Near ${safeCampus}</text>
        </g>

        <!-- Bottom Badges -->
        <g transform="translate(60, 555)">
          <rect x="0" y="0" width="170" height="38" rx="19" fill="#10B981" />
          <text x="85" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="15" font-weight="800" fill="#FFFFFF" text-anchor="middle">✓ VERIFIED ROOM</text>

          <rect x="185" y="0" width="230" height="38" rx="19" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.25)" stroke-width="1" />
          <text x="300" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="14" font-weight="700" fill="#F3F4F6" text-anchor="middle">💬 Contact on WhatsApp</text>
        </g>

        <!-- Price Box on Bottom Right -->
        <g transform="translate(860, 515)">
          <text x="280" y="42" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="44" font-weight="900" fill="#F59E0B" text-anchor="end">₦${formattedPrice}</text>
          <text x="280" y="70" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="18" font-weight="700" fill="#9CA3AF" text-anchor="end">per year</text>
        </g>
      </svg>
    `);

    const outputJpeg = await baseSharp
      .composite([{ input: overlaySvg, top: 0, left: 0 }])
      .jpeg({ quality: 80, progressive: true })
      .toBuffer();

    return new Response(outputJpeg, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("[OG:LISTING] Error generating listing OG image:", err);
    return getFallbackImageResponse();
  }
}
