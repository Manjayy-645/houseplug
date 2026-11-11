import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { logAdminAction } from "@/lib/audit";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,banned,is_banned")
    .eq("id", user.id)
    .single();
  if (
    profile?.banned ||
    profile?.is_banned ||
    !["admin", "super_admin"].includes(profile?.role || "")
  )
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { targetUserId, action, reason } = await request.json();
  if (!targetUserId || !action)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const serviceClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  try {
    const { data: targetUser } = await serviceClient
      .from("profiles")
      .select("full_name, email")
      .eq("id", targetUserId)
      .single();

    if (action === "ban") {
      const { error } = await serviceClient
        .from("profiles")
        .update({ banned: true, is_banned: true })
        .eq("id", targetUserId);
      if (error) throw error;

      await serviceClient.from("bans").insert({
        user_id: targetUserId,
        reason,
        banned_by: user.id,
      });

      // Send email
      if (targetUser?.email) {
        try {
          const { Resend } = require("resend");
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: "HousePlug <noreply@send.houseplug.ng>",
            to: targetUser.email,
            subject: "Your HousePlug account has been suspended",
            html: `<p>Your account has been suspended.</p><p>Reason: ${reason}</p><p>If you believe this is a mistake, you can <a href="https://houseplug.ng/appeal">submit an appeal</a>.</p>`,
          });
        } catch (e) {
          console.error("Failed to send ban email", e);
        }
      }

      await logAdminAction({
        admin_id: user.id,
        action: "banned_user",
        target_type: "user",
        target_id: targetUserId,
        details: {
          full_name: targetUser?.full_name,
          email: targetUser?.email,
          reason,
        },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "unban") {
      const { error } = await serviceClient
        .from("profiles")
        .update({ banned: false, is_banned: false })
        .eq("id", targetUserId);
      if (error) throw error;

      await serviceClient
        .from("bans")
        .update({ is_active: false })
        .eq("user_id", targetUserId)
        .eq("is_active", true);

      await logAdminAction({
        admin_id: user.id,
        action: "unbanned_user",
        target_type: "user",
        target_id: targetUserId,
        details: { full_name: targetUser?.full_name, email: targetUser?.email },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
