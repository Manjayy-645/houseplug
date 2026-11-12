import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { logAdminAction } from "@/lib/audit";
import { cleanupListingMedia } from "@/lib/storage";
import { sendListingStatusEmail } from "@/lib/email";

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

  const { listingId, action, reason, show_on_home } = await request.json();
  if (!listingId)
    return NextResponse.json({ error: "Missing listingId" }, { status: 400 });

  const serviceClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  try {
    const { data: listing } = await serviceClient
      .from("listings")
      .select(
        "title, landlord_id, video_url, rejection_count, area, university, profiles!landlord_id(email)",
      )
      .eq("id", listingId)
      .single();

    const landlordEmail = (listing?.profiles as any)?.email;

    if (action === "approve") {
      const { error } = await serviceClient
        .from("listings")
        .update({ status: "active", rejection_reason: null })
        .eq("id", listingId);
      if (error) throw error;

      await logAdminAction({
        admin_id: user.id,
        action: "approved_listing",
        target_type: "listing",
        target_id: listingId,
        details: { title: listing?.title },
      });

      await serviceClient.from("activity_events").insert({
        event_type: "new_listing",
        listing_id: listingId,
        area: listing?.area,
        university: listing?.university,
      });

      if (landlordEmail) {
        await sendListingStatusEmail({
          landlordEmail,
          listingTitle: listing?.title || "Your Listing",
          status: "approved",
          listingId,
        });
      }

      return NextResponse.json({ success: true });
    }

    if (action === "reject") {
      const newCount = (listing?.rejection_count || 0) + 1;
      const { error } = await serviceClient
        .from("listings")
        .update({
          status: "rejected",
          rejection_reason: reason,
          rejection_count: newCount,
        })
        .eq("id", listingId);
      if (error) throw error;

      await logAdminAction({
        admin_id: user.id,
        action: "rejected_listing",
        target_type: "listing",
        target_id: listingId,
        details: { title: listing?.title, reason },
      });

      if (landlordEmail) {
        await sendListingStatusEmail({
          landlordEmail,
          listingTitle: listing?.title || "Your Listing",
          status: "rejected",
          listingId,
          rejectionReason: reason,
        });
      }

      return NextResponse.json({ success: true });
    }

    if (action === "toggle_home") {
      const { error } = await serviceClient
        .from("listings")
        .update({ show_on_home })
        .eq("id", listingId);
      if (error) throw error;
      await logAdminAction({
        admin_id: user.id,
        action: "modified_listing_home",
        target_type: "listing",
        target_id: listingId,
        details: { title: listing?.title, show_on_home },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "delete") {
      // Remove stored photos + video before dropping the row so nothing is orphaned.
      if (listing) {
        await cleanupListingMedia(serviceClient, {
          id: listingId,
          landlord_id: listing.landlord_id,
          video_url: listing.video_url,
        });
      }
      const { error } = await serviceClient
        .from("listings")
        .delete()
        .eq("id", listingId);
      if (error) throw error;
      await logAdminAction({
        admin_id: user.id,
        action: "deleted_listing",
        target_type: "listing",
        target_id: listingId,
        details: { title: listing?.title },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
