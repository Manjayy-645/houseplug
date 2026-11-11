import { NextResponse } from "next/server";
import { z } from "zod";
import { requestActor, sameOrigin } from "@/lib/request-auth";
const schema = z.object({
  status: z.enum(["reviewing", "resolved", "dismissed"]),
  resolution: z.string().trim().min(10).max(1000),
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
      { error: "Add resolution details" },
      { status: 400 },
    );
  const { error } = await a.db
    .from("reports")
    .update({
      ...p.data,
      resolved_at:
        p.data.status === "reviewing" ? null : new Date().toISOString(),
    })
    .eq("id", params.id);
  return NextResponse.json({ success: !error }, { status: error ? 400 : 200 });
}
