import { NextResponse } from "next/server";
import { z } from "zod";
import { requestActor, sameOrigin } from "@/lib/request-auth";
import { leadTransitions } from "@/lib/request-schema";
const schema = z.object({
  status: z.enum([
    "qualified",
    "matching",
    "connected",
    "closed_unmatched",
    "cancelled",
    "rented",
    "spam",
  ]),
  assigned_agent_id: z.string().uuid().optional(),
});
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  if (!sameOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const actor = await requestActor();
  if (!actor)
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid transition" }, { status: 400 });
  const { data: h } = await actor.db
    .from("housing_requests")
    .select("id,status,user_id,assigned_agent_id")
    .eq("id", params.id)
    .single();
  if (
    !h ||
    (!actor.admin && h.user_id !== actor.id && h.assigned_agent_id !== actor.id)
  )
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (
    !actor.admin &&
    h.assigned_agent_id !== actor.id &&
    parsed.data.status !== "cancelled"
  )
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (parsed.data.assigned_agent_id && !actor.admin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!leadTransitions[h.status]?.includes(parsed.data.status))
    return NextResponse.json({ error: "Invalid transition" }, { status: 409 });
  const { error } = await actor.db.rpc("transition_housing_request", {
    request_id: h.id,
    actor_id: actor.id,
    next_status: parsed.data.status,
    agent_id: parsed.data.assigned_agent_id ?? null,
  });
  return error
    ? NextResponse.json({ error: "Transition rejected" }, { status: 409 })
    : NextResponse.json({ success: true });
}
