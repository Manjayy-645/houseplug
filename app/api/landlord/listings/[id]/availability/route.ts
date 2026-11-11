import { NextResponse } from "next/server";
import { z } from "zod";
import { requestActor, sameOrigin } from "@/lib/request-auth";
const schema = z.object({ available: z.boolean() });
export async function POST(r: Request, { params }: { params: { id: string } }) {
  if (!sameOrigin(r))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const a = await requestActor();
  if (!a || !["landlord", "agent"].includes(a.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const p = schema.safeParse(await r.json().catch(() => null));
  if (!p.success)
    return NextResponse.json({ error: "Choose availability" }, { status: 400 });
  const { error } = await a.db.rpc("confirm_listing_availability", {
    listing_id: params.id,
    actor_id: a.id,
    available: p.data.available,
  });
  return error
    ? NextResponse.json(
        { error: "Only your approved properties can be reconfirmed" },
        { status: 409 },
      )
    : NextResponse.json({ success: true });
}
