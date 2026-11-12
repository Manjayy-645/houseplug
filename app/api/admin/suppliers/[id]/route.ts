import { NextResponse } from "next/server";
import { z } from "zod";
import { requestActor, sameOrigin } from "@/lib/request-auth";

const schema = z.object({
  approved: z.boolean(),
  evidence_reference: z
    .string()
    .trim()
    .min(3)
    .max(500)
    .optional()
    .default("Verified by HousePlug Admin Review"),
  days: z.number().int().min(1).max(365).optional().default(90),
  safety_requirements: z
    .string()
    .trim()
    .min(20)
    .max(1000)
    .optional()
    .default("Identity, category safety guidelines, and student contact confirmed."),
  service_hours: z
    .string()
    .trim()
    .min(3)
    .max(120)
    .optional()
    .default("Mon-Sat 8:00 AM - 6:00 PM"),
});

export async function PATCH(
  r: Request,
  { params }: { params: { id: string } },
) {
  if (!sameOrigin(r))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const a = await requestActor();
  if (!a?.admin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const raw = await r.json().catch(() => ({}));
  const p = schema.safeParse(raw);
  if (!p.success) {
    return NextResponse.json(
      { error: p.error.issues[0]?.message || "Invalid payload" },
      { status: 400 },
    );
  }

  const { error } = await a.db.rpc("review_supplier", {
    service_id: params.id,
    reviewer_id: a.id,
    payload: p.data,
  });

  if (error) {
    console.error("[ADMIN_SERVICE_REVIEW] RPC review_supplier error:", error);
    return NextResponse.json({ error: error.message || "Failed to update service" }, { status: 400 });
  }

  return NextResponse.json({ success: true, status: p.data.approved ? "active" : "paused" }, { status: 200 });
}

export async function DELETE(
  r: Request,
  { params }: { params: { id: string } },
) {
  if (!sameOrigin(r))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const a = await requestActor();
  if (!a?.admin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await a.db
    .from("service_providers")
    .delete()
    .eq("id", params.id);

  if (error) {
    console.error("[ADMIN_SERVICE_DELETE] error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
