import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { logAdminAction } from "@/lib/audit";
import { sendVerificationStatusEmail } from "@/lib/email";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,banned,is_banned")
    .eq("id", user.id)
    .single();

  if (
    profile?.banned ||
    profile?.is_banned ||
    !["admin", "super_admin"].includes(profile?.role || "")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { landlord_id, action, rejection_reason, rejection_note } = body;

  if (!landlord_id || !action) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  // Use service role for administrative updates
  const serviceClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  try {
    const { data: landlord } = await serviceClient
      .from("profiles")
      .select("full_name, email")
      .eq("id", landlord_id)
      .single();

    if (action === "approve") {
      const { error } = await serviceClient
        .from("profiles")
        .update({
          verification_status: "verified",
          verified_at: new Date().toISOString(),
          verified_by: user.id,
          verification_note: null,
        })
        .eq("id", landlord_id);

      if (error) throw error;

      await logAdminAction({
        admin_id: user.id,
        action: "verified_landlord",
        target_type: "user",
        target_id: landlord_id,
        details: { landlord_name: landlord?.full_name },
      });

      const { data: firstListing } = await serviceClient
        .from("listings")
        .select("area, university")
        .eq("landlord_id", landlord_id)
        .limit(1)
        .single();

      await serviceClient.from("activity_events").insert({
        event_type: "verified_landlord",
        area: firstListing?.area || null,
        university: firstListing?.university || null,
      });

      if (landlord?.email) {
        await sendVerificationStatusEmail({
          landlordEmail: landlord.email,
          landlordName: landlord.full_name || "Landlord",
          status: "verified",
        });
      }

      return NextResponse.json({ success: true, message: "Landlord verified" });
    }

    if (action === "reject") {
      if (!rejection_reason) {
        return NextResponse.json(
          { error: "Rejection reason is required" },
          { status: 400 },
        );
      }
      const full_note =
        rejection_reason + (rejection_note ? ": " + rejection_note : "");
      const { error } = await serviceClient
        .from("profiles")
        .update({
          verification_status: "rejected",
          verification_note: full_note,
          verified_at: null,
          verified_by: null,
        })
        .eq("id", landlord_id);

      if (error) throw error;

      await logAdminAction({
        admin_id: user.id,
        action: "rejected_verification",
        target_type: "user",
        target_id: landlord_id,
        details: { landlord_name: landlord?.full_name, reason: full_note },
      });

      if (landlord?.email) {
        await sendVerificationStatusEmail({
          landlordEmail: landlord.email,
          landlordName: landlord.full_name || "Landlord",
          status: "rejected",
          rejectionReason: full_note,
        });
      }

      return NextResponse.json({
        success: true,
        message: "Verification rejected",
      });
    }

    if (action === "revoke") {
      const { data: landlord } = await serviceClient
        .from("profiles")
        .select("full_name")
        .eq("id", landlord_id)
        .single();
      const { error } = await serviceClient
        .from("profiles")
        .update({
          verification_status: "unverified",
          verified_at: null,
          verified_by: null,
          verification_note: "Verification revoked by admin",
        })
        .eq("id", landlord_id);

      if (error) throw error;

      await logAdminAction({
        admin_id: user.id,
        action: "revoked_verification",
        target_type: "user",
        target_id: landlord_id,
        details: { landlord_name: landlord?.full_name },
      });

      return NextResponse.json({
        success: true,
        message: "Verification revoked",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("[ADMIN_VERIFY] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
