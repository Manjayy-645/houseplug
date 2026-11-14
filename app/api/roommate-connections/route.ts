import { NextResponse } from "next/server";
import { z } from "zod";
import { requestActor, sameOrigin } from "@/lib/request-auth";

const schema = z.object({
  action: z.enum([
    "request",
    "accept",
    "decline",
    "revoke",
    "block",
    "contact",
  ]),
  target_user_id: z.string().uuid(),
});

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const a = await requestActor();
  if (!a || a.role !== "student") {
    return NextResponse.json(
      { error: "Only verified student accounts can request or manage roommate connections." },
      { status: 403 },
    );
  }

  const p = schema.safeParse(await request.json().catch(() => null));
  if (!p.success) {
    return NextResponse.json({ error: "Invalid connection parameters." }, { status: 400 });
  }

  if (p.data.target_user_id === a.id) {
    return NextResponse.json(
      { error: "You cannot request a connection with your own profile." },
      { status: 400 },
    );
  }

  // Pre-flight checks specifically for new connection requests
  if (p.data.action === "request") {
    // 1. Verify that the requester has an active, valid roommate profile
    const { data: actorProfile } = await a.db
      .from("roommate_profiles")
      .select("status, visibility_consent, expires_at")
      .eq("user_id", a.id)
      .maybeSingle();

    if (!actorProfile) {
      return NextResponse.json(
        {
          error:
            "Please create and publish your roommate profile first so other students can view your preferences before connecting.",
          code: "PROFILE_REQUIRED",
        },
        { status: 400 },
      );
    }

    if (actorProfile.status !== "active") {
      return NextResponse.json(
        {
          error:
            "Your roommate profile is currently paused or inactive. Please activate your profile in your dashboard to connect.",
          code: "PROFILE_INACTIVE",
        },
        { status: 400 },
      );
    }

    if (!actorProfile.visibility_consent) {
      return NextResponse.json(
        {
          error:
            "You must enable visibility consent on your roommate profile before requesting connections.",
          code: "CONSENT_REQUIRED",
        },
        { status: 400 },
      );
    }

    if (actorProfile.expires_at && new Date(actorProfile.expires_at) <= new Date()) {
      return NextResponse.json(
        {
          error:
            "Your roommate profile has expired. Please renew or update your profile in your dashboard to connect.",
          code: "PROFILE_EXPIRED",
        },
        { status: 400 },
      );
    }

    // 2. Verify that the target student's roommate profile is active and valid
    const { data: targetProfile } = await a.db
      .from("roommate_profiles")
      .select("status, visibility_consent, expires_at")
      .eq("user_id", p.data.target_user_id)
      .maybeSingle();

    if (
      !targetProfile ||
      targetProfile.status !== "active" ||
      !targetProfile.visibility_consent ||
      (targetProfile.expires_at && new Date(targetProfile.expires_at) <= new Date())
    ) {
      return NextResponse.json(
        {
          error:
            "This student's roommate profile is currently inactive, expired, or no longer accepting connections.",
          code: "TARGET_UNAVAILABLE",
        },
        { status: 400 },
      );
    }

    // 3. Verify neither student has blocked the other
    const { data: block } = await a.db
      .from("user_blocks")
      .select("blocker_id")
      .or(
        `and(blocker_id.eq.${a.id},blocked_id.eq.${p.data.target_user_id}),and(blocker_id.eq.${p.data.target_user_id},blocked_id.eq.${a.id})`,
      )
      .maybeSingle();

    if (block) {
      return NextResponse.json(
        {
          error: "Unable to connect with this student.",
          code: "BLOCKED",
        },
        { status: 400 },
      );
    }

    // 4. Check if a connection already exists
    const { data: existingConn } = await a.db
      .from("roommate_connections")
      .select("id, requester_id, recipient_id, status")
      .or(
        `and(requester_id.eq.${a.id},recipient_id.eq.${p.data.target_user_id}),and(requester_id.eq.${p.data.target_user_id},recipient_id.eq.${a.id})`,
      )
      .maybeSingle();

    if (existingConn) {
      if (existingConn.status === "pending") {
        const isRequester = existingConn.requester_id === a.id;
        return NextResponse.json(
          {
            success: true,
            status: "pending",
            alreadyExists: true,
            message: isRequester
              ? "Connection request is already pending. You can chat once they accept."
              : "This student has already sent you a connection request. Visit your dashboard to accept.",
          },
          { status: 200 },
        );
      }
      if (existingConn.status === "accepted") {
        return NextResponse.json(
          {
            success: true,
            status: "accepted",
            alreadyExists: true,
            message: "You are already connected with this student.",
          },
          { status: 200 },
        );
      }
      if (existingConn.status === "declined") {
        return NextResponse.json(
          {
            error: "A previous connection request with this student was declined.",
            code: "DECLINED",
          },
          { status: 400 },
        );
      }
      if (existingConn.status === "revoked") {
        return NextResponse.json(
          {
            error: "This connection was previously revoked.",
            code: "REVOKED",
          },
          { status: 400 },
        );
      }
    }

    // 5. Check daily request rate limit (max 10 in 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: dailyCount } = await a.db
      .from("roommate_connections")
      .select("id", { count: "exact", head: true })
      .eq("requester_id", a.id)
      .gt("created_at", oneDayAgo);

    if ((dailyCount ?? 0) >= 10) {
      return NextResponse.json(
        {
          error:
            "You have reached your daily limit of 10 connection requests. Please try again tomorrow.",
          code: "RATE_LIMITED",
        },
        { status: 429 },
      );
    }
  }

  const { data, error } = await a.db.rpc("manage_roommate_connection", {
    actor_id: a.id,
    target_id: p.data.target_user_id,
    action: p.data.action,
  });

  if (error) {
    let userMessage = "Unable to complete connection request.";
    const errMsg = error.message || "";
    if (errMsg.includes("Profile unavailable")) {
      userMessage = "One or both roommate profiles are no longer active, visible, or have expired.";
    } else if (errMsg.includes("Connection unavailable")) {
      userMessage = "Unable to connect with this student.";
    } else if (errMsg.includes("Request limit reached")) {
      userMessage = "You have reached your daily limit of 10 connection requests. Please try again tomorrow.";
    } else if (errMsg.includes("Connection not found")) {
      userMessage = "No existing connection was found.";
    } else if (errMsg.includes("Invalid connection transition")) {
      userMessage = "This connection cannot be transitioned to that state.";
    } else if (errMsg.includes("Forbidden")) {
      userMessage = "Only active student accounts can manage roommate connections.";
    }

    return NextResponse.json({ error: userMessage }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    action: p.data.action,
    contact: p.data.action === "contact" ? data : null,
  });
}
