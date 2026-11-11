import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { logAdminAction } from "@/lib/audit";
import { cleanupListingMedia } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Verify caller is super_admin.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: caller } = await supabase
    .from("profiles")
    .select("role,banned,is_banned")
    .eq("id", user.id)
    .single();

  if (caller?.banned || caller?.is_banned || caller?.role !== "super_admin") {
    return NextResponse.json(
      { error: "Only super admins can delete users" },
      { status: 403 },
    );
  }

  const { userId } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: "No user ID" }, { status: 400 });
  }

  // Prevent deleting yourself.
  if (userId === user.id) {
    return NextResponse.json(
      { error: "You cannot delete your own account" },
      { status: 400 },
    );
  }

  // Service client for admin operations (bypasses RLS, has auth admin API).
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // Prevent deleting other super admins.
  const { data: target } = await service
    .from("profiles")
    .select("role, phone, email")
    .eq("id", userId)
    .single();

  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (target.role === "super_admin") {
    return NextResponse.json(
      { error: "Cannot delete a super admin" },
      { status: 403 },
    );
  }

  try {
    // 1. Clean up listing media (photos + Cloudinary videos) before the
    //    profile cascade drops the listing rows — otherwise those files orphan.
    const { data: listings } = await service
      .from("listings")
      .select("id, landlord_id, video_url")
      .eq("landlord_id", userId);

    if (listings && listings.length > 0) {
      await Promise.all(listings.map((l) => cleanupListingMedia(service, l)));
    }

    // 2. Clean up verification documents from storage.
    const { data: files } = await service.storage
      .from("verifications")
      .list(userId);
    if (files && files.length > 0) {
      await service.storage
        .from("verifications")
        .remove(files.map((f) => `${userId}/${f.name}`));
    }

    // 3. Clean up avatar from storage.
    const { data: avatars } = await service.storage
      .from("avatars")
      .list(userId);
    if (avatars && avatars.length > 0) {
      await service.storage
        .from("avatars")
        .remove(avatars.map((f) => `${userId}/${f.name}`));
    }

    // 4. Clear trial registry entries so a deleted account doesn't leave a
    //    dangling lock (and a fresh signup with the same contact can re-trial).
    if (target.phone) {
      const normalized = target.phone.replace(/[^0-9]/g, "");
      await service
        .from("trial_phone_registry")
        .delete()
        .in("phone", [target.phone, normalized]);
    }
    if (target.email) {
      await service
        .from("trial_email_registry")
        .delete()
        .eq("email", target.email);
    }

    // 5. Delete the profile row — cascades to listings, reviews, subscriptions,
    //    payments, and boosts via the ON DELETE CASCADE foreign keys.
    const { error: profileError } = await service
      .from("profiles")
      .delete()
      .eq("id", userId);
    if (profileError) {
      console.error("[DELETE USER] Profile delete failed:", profileError);
      return NextResponse.json(
        { error: "Failed to delete profile data" },
        { status: 500 },
      );
    }

    // 6. Delete from Supabase Auth.
    const { error: authError } = await service.auth.admin.deleteUser(userId);
    if (authError) {
      console.error("[DELETE USER] Auth delete failed:", authError);
      return NextResponse.json(
        { error: "Profile deleted but auth deletion failed" },
        { status: 500 },
      );
    }

    // 7. Audit trail.
    await logAdminAction({
      admin_id: user.id,
      action: "delete_user",
      target_type: "user",
      target_id: userId,
      details: { deleted_email: target.email, deleted_role: target.role },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE USER] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}
