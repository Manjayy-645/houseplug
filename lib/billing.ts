"use server";
import { assertPaymentMatches } from "@/lib/payment-schema";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { sendAdminNotification } from "./email";

export async function processSuccessfulPayment(transaction: any) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "Supabase configuration missing (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)",
    );
  }

  const supabase = createSupabaseClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { metadata, reference, amount, currency } = transaction;

  if (!reference) {
    throw new Error(
      "Missing transaction reference in processSuccessfulPayment",
    );
  }

  // Idempotency: the initiate route inserts a pending payment row, and BOTH the
  // callback and the webhook call this function for the same reference. If we've
  // already marked this reference successful, the side effects ran — bail out so
  // we don't double-apply boosts or duplicate records.
  const { data: existingPayment } = await supabase
    .from("payments")
    .select("*")
    .eq("paystack_reference", reference)
    .maybeSingle();

  if (
    existingPayment?.status === "success" &&
    (existingPayment.fulfilment_status == null ||
      existingPayment.fulfilment_status === "fulfilled")
  ) {
    console.log("[BILLING] Payment already processed, skipping:", reference);
    return;
  }

  if (!existingPayment)
    throw new Error("Payment order not found; reconciliation required");
  assertPaymentMatches(transaction, existingPayment);
  const { data: anchor, error: claimError } = await supabase.rpc(
    "claim_payment_fulfilment",
    { payment_reference: reference },
  );
  if (claimError) throw new Error("Could not claim payment fulfilment");
  if (!anchor)
    throw new Error(
      "Payment fulfilment is processing; retry verification later",
    );
  const anchorTime = new Date(anchor);
  try {
    // Resolve metadata: use Paystack metadata if present, fallback to existing DB payment row
    const landlord_id = metadata?.landlord_id || existingPayment?.landlord_id;
    const type = metadata?.type || existingPayment?.type;
    const plan = metadata?.plan || existingPayment?.plan;
    const billing_cycle =
      metadata?.billing_cycle || existingPayment?.billing_cycle;
    const listing_id = metadata?.listing_id || existingPayment?.listing_id;
    const boost_type = metadata?.boost_type || existingPayment?.boost_type;
    const service_id = metadata?.service_id || existingPayment?.service_id;

    if (!landlord_id || !type) {
      throw new Error(
        `Missing landlord_id or type in transaction (${reference}) and DB record`,
      );
    }

    // Upsert payment row to 'success' using the unique paystack_reference
    const { error: paymentError } = await supabase.from("payments").upsert(
      {
        landlord_id,
        type,
        plan: plan ?? null,
        billing_cycle: billing_cycle ?? null,
        listing_id: listing_id ?? null,
        boost_type: boost_type ?? null,
        service_id: service_id ?? null,
        amount: amount ?? existingPayment?.amount ?? 0,
        paystack_reference: reference,
        status: "success",
      },
      { onConflict: "paystack_reference" },
    );

    if (paymentError) {
      throw new Error("Could not persist payment");
    }

    if (type === "subscription") {
      const months = billing_cycle === "annual" ? 12 : 1;
      const expires_at = new Date(anchorTime);
      expires_at.setMonth(expires_at.getMonth() + months);

      console.log("[BILLING] Upserting subscription:", {
        landlord_id,
        plan,
        billing_cycle,
        expires_at,
      });

      const { error: subError } = await supabase.from("subscriptions").upsert(
        {
          landlord_id,
          plan,
          billing_cycle,
          is_trial: false,
          active: true,
          amount_paid: amount,
          paystack_reference: reference,
          expires_at: expires_at.toISOString(),
        },
        { onConflict: "landlord_id" },
      );

      if (subError) {
        console.error("[BILLING] Subscription upsert error:", subError);
        throw new Error(`Subscription upsert failed: ${subError.message}`);
      }

      // Set all active listings as featured
      const { error: featuredError } = await supabase
        .from("listings")
        .update({ is_featured: true })
        .eq("landlord_id", landlord_id)
        .eq("status", "active");

      if (featuredError) {
        throw new Error("Featured update failed");
      }

      console.log("[BILLING] Subscription updated successfully");
    }

    if (type === "boost") {
      if (!listing_id || !boost_type) throw new Error("Incomplete boost order");

      const now = new Date(anchorTime);
      let expiresAt: Date | null = null;
      const updateData: Record<string, any> = {};

      if (boost_type === "featured_7") {
        expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        updateData.is_featured = true;
        updateData.boost_expires_at = expiresAt.toISOString();
      } else if (boost_type === "featured_30") {
        expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        updateData.is_featured = true;
        updateData.boost_expires_at = expiresAt.toISOString();
      } else if (boost_type === "urgent") {
        expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        updateData.is_urgent = true;
        updateData.boost_expires_at = expiresAt.toISOString();
      } else if (boost_type === "refresh") {
        // Browse sorts newest by created_at, so bumping it floats the listing up.
        updateData.created_at = now.toISOString();
      } else {
        console.error("[BILLING] Unknown boost_type:", boost_type);
        return;
      }

      console.log("[BILLING] Processing boost:", {
        listing_id,
        boost_type,
        expiresAt,
      });

      // Apply the boost to the listing FIRST so the badge/placement lands even if
      // the audit-trail insert below fails. Never throw here.
      const { error: updateError } = await supabase
        .from("listings")
        .update(updateData)
        .eq("id", listing_id);

      if (updateError) {
        throw new Error("Boost update failed");
      }

      // Best-effort audit record — must never crash the payment flow.
      try {
        const { error: boostError } = await supabase
          .from("listing_boosts")
          .upsert(
            {
              listing_id,
              landlord_id,
              boost_type,
              amount,
              active: boost_type !== "refresh",
              expires_at: expiresAt
                ? expiresAt.toISOString()
                : now.toISOString(),
              paystack_reference: reference,
            },
            { onConflict: "paystack_reference" },
          );
        if (boostError) {
          throw new Error("Boost record write failed");
        }
      } catch (e) {
        throw e;
      }

      console.log("[BILLING] Boost applied successfully");
    }

    if (type === "verification") {
      // Mark paid (so a rejected user can resubmit for free) and submit the docs
      // that were uploaded before payment and carried through the metadata.
      const { error: verifyError } = await supabase
        .from("profiles")
        .update({
          verification_paid: true,
          verification_payment_ref: reference,
          verification_status: "pending",
          id_document_url: metadata?.id_document_url ?? null,
          id_document_back_url: metadata?.id_document_back_url ?? null,
          selfie_url: metadata?.selfie_url ?? null,
          property_document_url: metadata?.property_document_url ?? null,
          id_document_type: metadata?.id_document_type ?? null,
          nin_number: metadata?.nin_number ?? null,
          verification_type: metadata?.verification_type ?? "identity",
          verification_note: null,
        })
        .eq("id", landlord_id);

      if (verifyError) {
        throw new Error("Verification update failed");
      }

      await sendAdminNotification(
        "New Verification Submission",
        "A landlord/agent has paid and submitted documents for verification. Review their ID and property docs.",
        `${process.env.NEXT_PUBLIC_APP_URL || "https://houseplug.ng"}/admin/verification`,
        "Review Verification",
      );
    }

    if (type === "service_listing") {
      const serviceId = service_id || metadata?.service_id;
      if (!serviceId) throw new Error("Incomplete service order");

      const expiresAt = new Date(anchorTime);
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { error: serviceError } = await supabase
        .from("service_providers")
        .update({
          listing_paid: true,
          listing_expires_at: expiresAt.toISOString(),
          listing_payment_ref: reference,
          status: "active",
        })
        .eq("id", serviceId);

      if (serviceError) {
        throw new Error("Service listing activation failed");
      } else {
        console.log(
          "[BILLING] Service listing activated successfully:",
          serviceId,
        );
      }
    }

    if (type === "service_boost") {
      const serviceId = service_id || metadata?.service_id;
      if (!serviceId || !boost_type)
        throw new Error("Incomplete service boost order");

      const now = new Date(anchorTime);
      let expiresAt: Date | null = null;
      const updateData: Record<string, any> = { is_boosted: true };

      if (boost_type === "featured_7") {
        expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        updateData.boost_type = "featured_7";
        updateData.boost_expires_at = expiresAt.toISOString();
      } else if (boost_type === "featured_30") {
        expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        updateData.boost_type = "featured_30";
        updateData.boost_expires_at = expiresAt.toISOString();
      } else if (boost_type === "urgent") {
        expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        updateData.boost_type = "urgent";
        updateData.boost_expires_at = expiresAt.toISOString();
      } else if (boost_type === "refresh") {
        updateData.created_at = now.toISOString();
        updateData.is_boosted = false;
      }

      const { error: boostError } = await supabase
        .from("service_providers")
        .update(updateData)
        .eq("id", serviceId);

      if (boostError) {
        throw new Error("Service boost failed");
      } else {
        console.log("[BILLING] Service boost applied successfully:", serviceId);
      }
    }
    const { error: finished } = await supabase
      .from("payments")
      .update({ fulfilment_status: "fulfilled", fulfilment_lease_until: null })
      .eq("paystack_reference", reference);
    if (finished) throw new Error("Could not complete payment fulfilment");
  } catch (error) {
    await supabase
      .from("payments")
      .update({ fulfilment_status: "failed", fulfilment_lease_until: null })
      .eq("paystack_reference", reference);
    throw error;
  }
}

export async function getLandlordSubscription(landlord_id: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createSupabaseClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Get the most recent subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("landlord_id", landlord_id)
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!subscription) {
    // Never subscribed — return free plan defaults
    return {
      plan: "free",
      active: true,
      expired: false,
      billing_cycle: null,
      expires_at: null,
    };
  }

  const isExpired =
    !subscription.active ||
    (subscription.expires_at && new Date(subscription.expires_at) < new Date());

  return {
    ...subscription,
    expired: isExpired,
  };
}

// True for an active paid OR trial Pro/Business subscription that hasn't expired.
export async function hasProAccess(landlord_id: string): Promise<boolean> {
  const sub = await getLandlordSubscription(landlord_id);
  return !sub.expired && ["pro", "business"].includes(sub.plan);
}

export async function getListingLimit(plan: string): Promise<number> {
  if (plan === "business") return Infinity;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createSupabaseClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const key = plan === "pro" ? "max_pro_listings" : "max_free_listings";

  const { data } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  if (data?.value) {
    const num = parseInt(data.value, 10);
    if (!isNaN(num)) return num;
  }

  // Fallbacks if not configured in DB
  return plan === "pro" ? Infinity : Infinity;
}

export async function formatListingLimit(plan: string): Promise<string> {
  if (plan === "business") return "Unlimited";
  const limit = await getListingLimit(plan);
  return limit === Infinity ? "Unlimited" : limit.toString();
}

import {
  isSubscriptionExpiringSoon as isSubscriptionExpiringSoonUtil,
  formatExpiryDate as formatExpiryDateUtil,
} from "./billing-utils";

export async function isSubscriptionExpiringSoon(
  expires_at: string | null,
): Promise<boolean> {
  return isSubscriptionExpiringSoonUtil(expires_at);
}

export async function formatExpiryDate(
  expires_at: string | null,
): Promise<string> {
  return formatExpiryDateUtil(expires_at);
}

/**
 * Grant a 30-day Pro trial to a new landlord. Centralised so every signup path
 * (email + Google OAuth) shares one set of rules. Caller is responsible for the
 * landlord-role gate; students must never be passed here.
 *
 * Abuse prevention: one trial per phone (email/password signups) or per email
 * (Google OAuth, which has no phone). Existing subscribers are skipped so a
 * trial is never duplicated. Never throws — failures are logged.
 *
 * `supabase` must be a service-role client (these registry/subscription tables
 * are RLS-locked).
 */
export async function grantTrialToNewUser(
  supabase: any,
  userId: string,
  phone?: string,
  email?: string,
): Promise<void> {
  try {
    // Never duplicate an existing subscription.
    const { data: existing } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("landlord_id", userId)
      .maybeSingle();
    if (existing) return;

    // Registry check — phone first (email/password signups), then email (OAuth).
    const normalizedPhone = (phone ?? "").replace(/[^0-9]/g, "");
    if (normalizedPhone) {
      const { data: used } = await supabase
        .from("trial_phone_registry")
        .select("phone")
        .eq("phone", normalizedPhone)
        .maybeSingle();
      if (used) return;

      await supabase
        .from("trial_phone_registry")
        .upsert(
          { phone: normalizedPhone },
          { onConflict: "phone", ignoreDuplicates: true },
        );
    } else if (email) {
      const { data: used } = await supabase
        .from("trial_email_registry")
        .select("email")
        .eq("email", email)
        .maybeSingle();
      if (used) return;

      await supabase
        .from("trial_email_registry")
        .upsert({ email }, { onConflict: "email", ignoreDuplicates: true });
    } else {
      return; // no identifier to dedupe on
    }

    const expiresAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString();
    await supabase.from("subscriptions").upsert(
      {
        landlord_id: userId,
        plan: "pro",
        is_trial: true,
        active: true,
        billing_cycle: "trial",
        amount_paid: 0,
        expires_at: expiresAt,
      },
      { onConflict: "landlord_id", ignoreDuplicates: true },
    );
  } catch (error) {
    console.error("[billing] grantTrialToNewUser failed:", error);
  }
}
