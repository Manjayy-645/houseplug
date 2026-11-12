import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { logAdminAction } from "@/lib/audit";

export const dynamic = "force-dynamic";

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
  if (profile?.banned || profile?.is_banned || profile?.role !== "super_admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { action, userId } = await request.json();
  if (!action || !userId)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const serviceClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  try {
    const { data: targetUser } = await serviceClient
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .single();

    if (action === "promote") {
      const { error } = await serviceClient
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", userId);
      if (error) throw error;
      await logAdminAction({
        admin_id: user.id,
        action: "created_admin",
        target_type: "user",
        target_id: userId,
        details: { email: targetUser?.email },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "revoke") {
      const { error } = await serviceClient
        .from("profiles")
        .update({ role: "student" })
        .eq("id", userId);
      if (error) throw error;
      await logAdminAction({
        admin_id: user.id,
        action: "revoked_admin",
        target_type: "user",
        target_id: userId,
        details: { email: targetUser?.email },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
