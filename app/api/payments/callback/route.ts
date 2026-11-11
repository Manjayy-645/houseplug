import { safeReturnTo } from "@/lib/site";
import { NextResponse } from "next/server";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { processSuccessfulPayment } from "@/lib/billing";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const rawReference =
    searchParams.get("reference") || searchParams.get("trxref");
  const reference = rawReference ? rawReference.trim() : null;

  console.log("[CALLBACK] Reference received:", reference);

  const rawBase = process.env.NEXT_PUBLIC_APP_URL || origin;
  const base = rawBase.replace(/\/+$/, "");

  if (!reference) {
    console.error("[CALLBACK] No reference in URL");
    return NextResponse.redirect(
      `${base}/landlord/subscription?error=no_reference`,
    );
  }

  try {
    const transaction = await verifyPaystackTransaction(reference);
    console.log("[CALLBACK] Transaction status:", transaction.status);

    if (transaction.status === "success") {
      await processSuccessfulPayment(transaction);
      console.log("[CALLBACK] processSuccessfulPayment completed");

      const type = transaction.metadata?.type;
      if (type === "verification") {
        return NextResponse.redirect(
          `${base}/landlord/verification?payment=success`,
        );
      }
      if (type === "boost") {
        return NextResponse.redirect(
          `${base}/landlord/subscription?boost=success`,
        );
      }
      if (type === "service_listing" || type === "service_boost") {
        const rawReturn = transaction.metadata?.return_url as
          string | undefined;
        // Ensure returnUrl is a valid relative path on our domain
        const returnUrl = safeReturnTo(rawReturn, "/services/manage");
        const boostType = transaction.metadata?.boost_type || "";
        const serviceId = transaction.metadata?.service_id || "";
        const action =
          type === "service_listing" ? "listing_active" : "boost_active";
        const params = new URLSearchParams({
          payment: "success",
          type,
          action,
          ...(boostType ? { boost_type: boostType } : {}),
          ...(serviceId ? { service_id: serviceId } : {}),
          ref: reference,
        });
        return NextResponse.redirect(
          `${base}${returnUrl}?${params.toString()}`,
        );
      }
      return NextResponse.redirect(
        `${base}/landlord/subscription?payment=success`,
      );
    }

    console.error("[CALLBACK] Payment not successful:", transaction.status);
    const failType = transaction.metadata?.type;
    if (failType === "verification") {
      return NextResponse.redirect(
        `${base}/landlord/verification?error=payment_failed`,
      );
    }
    if (failType === "service_listing" || failType === "service_boost") {
      const rawReturn = transaction.metadata?.return_url as string | undefined;
      const returnUrl = safeReturnTo(rawReturn, "/services/manage");
      const serviceId = transaction.metadata?.service_id || "";
      const params = new URLSearchParams({
        error: "payment_failed",
        type: failType,
        ...(serviceId ? { service_id: serviceId } : {}),
      });
      return NextResponse.redirect(`${base}${returnUrl}?${params.toString()}`);
    }
    return NextResponse.redirect(
      `${base}/landlord/subscription?error=payment_failed`,
    );
  } catch (error) {
    console.error("[CALLBACK] Error verifying or processing payment:", error);
    // The payment itself may have succeeded (the webhook is the backup that
    // applies it). Fall back to looking up the initiated payment type in the database.
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && serviceKey && reference) {
        const supabase = createSupabaseClient(supabaseUrl, serviceKey);
        const { data: payRecord } = await supabase
          .from("payments")
          .select("type, service_id")
          .eq("paystack_reference", reference)
          .maybeSingle();

        if (payRecord) {
          if (payRecord.type === "verification") {
            return NextResponse.redirect(
              `${base}/landlord/verification?status=processing`,
            );
          }
          if (payRecord.type === "boost") {
            return NextResponse.redirect(
              `${base}/landlord/subscription?status=processing&boost=true`,
            );
          }
          if (
            payRecord.type === "service_listing" ||
            payRecord.type === "service_boost"
          ) {
            return NextResponse.redirect(
              `${base}/services/manage?status=processing&type=${payRecord.type}`,
            );
          }
        }
      }
    } catch (e) {
      console.error("[CALLBACK] Secondary lookup failed:", e);
    }

    return NextResponse.redirect(
      `${base}/landlord/subscription?status=processing`,
    );
  }
}
