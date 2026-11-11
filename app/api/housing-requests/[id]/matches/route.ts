import { NextResponse } from "next/server";
import { z } from "zod";
import { requestActor, sameOrigin } from "@/lib/request-auth";
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  if (!sameOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const actor = await requestActor();
  if (!actor?.admin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = z
    .object({ listing_ids: z.array(z.string().uuid()).min(1).max(3) })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: "Choose one to three rooms" },
      { status: 400 },
    );
  const { error } = await actor.db.rpc("suggest_housing_options", {
    request_id: params.id,
    actor_id: actor.id,
    listing_ids: parsed.data.listing_ids,
  });
  return error
    ? NextResponse.json(
        {
          error:
            "Rooms must be current, on campus and within the confirmed total budget",
        },
        { status: 409 },
      )
    : NextResponse.json({ success: true });
}
