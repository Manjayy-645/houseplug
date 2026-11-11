import { NextResponse } from "next/server";
import { z } from "zod";
import { requestActor, sameOrigin } from "@/lib/request-auth";
const schema = z.object({
  code: z.string().regex(/^[a-z0-9_-]{3,40}$/),
  campaign: z.string().regex(/^[a-z][a-z0-9_-]{0,79}$/),
  ambassador_id: z.string().uuid().optional(),
  expires_at: z.string().datetime().optional(),
  active: z.boolean(),
});
export async function POST(r: Request) {
  if (!sameOrigin(r))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const a = await requestActor();
  if (!a?.admin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = schema.safeParse(await r.json().catch(() => null));
  if (!p.success)
    return NextResponse.json(
      { error: "Use lowercase campaign codes without personal details" },
      { status: 400 },
    );
  const { error } = await a.db
    .from("referral_codes")
    .upsert(p.data, { onConflict: "code" });
  return NextResponse.json({ success: !error }, { status: error ? 400 : 200 });
}
