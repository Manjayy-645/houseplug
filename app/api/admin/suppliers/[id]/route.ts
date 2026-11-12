import { NextResponse } from "next/server";
import { z } from "zod";
import { requestActor, sameOrigin } from "@/lib/request-auth";
const schema = z.object({
  evidence_reference: z.string().trim().min(3).max(500),
  approved: z.boolean(),
  days: z.number().int().min(1).max(365),
  safety_requirements: z.string().trim().min(20).max(1000),
  service_hours: z.string().trim().min(3).max(120),
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
  const p = schema.safeParse(await r.json().catch(() => null));
  if (!p.success)
    return NextResponse.json(
      { error: p.error.issues[0].message },
      { status: 400 },
    );
  const { error } = await a.db.rpc("review_supplier", {
    service_id: params.id,
    reviewer_id: a.id,
    payload: p.data,
  });
  return NextResponse.json({ success: !error }, { status: error ? 400 : 200 });
}
