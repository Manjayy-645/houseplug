import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCloudinaryPolicy } from "@/lib/cloudinary-protection"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { allowed: false, error: "Please sign in to upload listing tour videos." },
        { status: 401 }
      )
    }

    // Check user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, banned, is_banned")
      .eq("id", user.id)
      .single()

    if (profile?.banned || profile?.is_banned) {
      return NextResponse.json(
        { allowed: false, error: "Your account is suspended." },
        { status: 403 }
      )
    }

    if (!["landlord", "agent", "admin", "super_admin"].includes(profile?.role || "")) {
      return NextResponse.json(
        { allowed: false, error: "Only verified landlords, agents, and administrators can upload tour videos." },
        { status: 403 }
      )
    }

    // Check active Cloudinary quota tier
    const policy = await getCloudinaryPolicy()

    if (!policy.uploadsAllowed) {
      return NextResponse.json(
        {
          allowed: false,
          tier: policy.tier,
          error: "Video tour uploads are temporarily at capacity to preserve bandwidth. Please upload high-quality photos instead (unlimited and free).",
        },
        { status: 429 }
      )
    }

    return NextResponse.json({
      allowed: true,
      tier: policy.tier,
      maxSizeBytes: policy.maxVideoSizeBytes,
      maxDurationSeconds: policy.maxVideoDurationSeconds,
    })
  } catch (err) {
    console.error("[VALIDATE_VIDEO_UPLOAD] Error:", err)
    // Fail-open for authenticated landlords with pilot limits if quota check encounters unexpected issue
    return NextResponse.json({
      allowed: true,
      maxSizeBytes: 15 * 1024 * 1024,
      maxDurationSeconds: 30,
    })
  }
}
