import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { featureFlags } from "@/lib/feature-flags";
import { SITE_URL } from "@/lib/site";
export async function GET(request: Request) {
  if (
    !process.env.CRON_SECRET ||
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  )
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = createServiceClient();
  const n = Number(process.env.HOUSING_RETENTION_DAYS);
  const retention =
    featureFlags.retention && Number.isInteger(n) && n >= 1 && n <= 3650
      ? n
      : null;
  const { data: maintenance, error } = await db.rpc("housing_maintenance", {
    retention_days: retention,
  });
  if (error)
    return NextResponse.json({ error: "Maintenance failed" }, { status: 500 });
  let sent = 0,
    failed = 0;
  if (featureFlags.notifications) {
    if (!process.env.RESEND_API_KEY || !process.env.HOUSING_OPS_EMAIL)
      return NextResponse.json(
        { error: "Notification configuration incomplete", maintenance },
        { status: 503 },
      );
    const { data: outbox, error: claimError } = await db.rpc(
      "claim_housing_outbox",
      { batch_size: 20 },
    );
    if (claimError)
      return NextResponse.json(
        { error: "Could not claim notification queue" },
        { status: 503 },
      );
    for (const item of outbox ?? []) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
            "Idempotency-Key": `houseplug:${item.id}`,
          },
          body: JSON.stringify({
            from:
              process.env.EMAIL_FROM || "HousePlug <noreply@send.houseplug.ng>",
            to: [process.env.HOUSING_OPS_EMAIL],
            subject: "Housing request queue update",
            text: `A housing request needs attention. Open the protected inbox: ${SITE_URL}/admin/requests`,
          }),
        });
        if (!response.ok) throw Error("Provider rejected notification");
        await db
          .from("notification_outbox")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            last_error: null,
          })
          .eq("id", item.id);
        sent++;
      } catch {
        await db
          .from("notification_outbox")
          .update({
            status: item.attempts >= 5 ? "failed" : "retry",
            last_error: "Provider delivery failed",
            next_attempt_at: new Date(
              Date.now() + Math.min(3600000, 30000 * 2 ** item.attempts),
            ).toISOString(),
          })
          .eq("id", item.id);
        failed++;
      }
    }
  }
  return NextResponse.json({ maintenance, sent, failed });
}
