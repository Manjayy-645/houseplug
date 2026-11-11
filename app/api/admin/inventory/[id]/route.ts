import { NextResponse } from "next/server";
import { requestActor, sameOrigin } from "@/lib/request-auth";
import { inventoryReviewSchema } from "@/lib/inventory-schema";
import { moveInTotal } from "@/lib/housing";
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  if (!sameOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const actor = await requestActor();
  if (!actor?.admin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = inventoryReviewSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  const p = parsed.data;
  const { data: listing } = await actor.db
    .from("listings")
    .select("price_yearly")
    .eq("id", params.id)
    .single();
  if (!listing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (
    p.fees_complete &&
    moveInTotal({ ...p, price_yearly: listing.price_yearly }) === null
  )
    return NextResponse.json(
      { error: "Mandatory fees are still unknown" },
      { status: 400 },
    );
  if (p.sharing_allowed && p.occupancy < 2)
    return NextResponse.json(
      { error: "Shared occupancy requires at least two permitted occupants" },
      { status: 400 },
    );
  const { error } = await actor.db.rpc("review_listing_truth", {
    listing_id: params.id,
    reviewer_id: actor.id,
    payload: p,
  });
  return error
    ? NextResponse.json({ error: "Could not record review" }, { status: 400 })
    : NextResponse.json({ success: true });
}
