import { NextResponse } from "next/server";
import { z } from "zod";
import { featureFlags } from "@/lib/feature-flags";
import { requestActor, sameOrigin } from "@/lib/request-auth";
const schema = z.object({
  provider_id: z.string().uuid(),
  description: z.string().trim().min(20).max(1000),
  contact_consent: z.literal(true),
});
export async function POST(request: Request) {
  if (!featureFlags.services)
    return NextResponse.json(
      { error: "Service requests are not open" },
      { status: 503 },
    );
  if (!sameOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const a = await requestActor();
  if (!a)
    return NextResponse.json(
      { error: "Sign in to request a quote" },
      { status: 401 },
    );
  const p = schema.safeParse(await request.json().catch(() => null));
  if (!p.success)
    return NextResponse.json(
      { error: "Describe the service and consent to follow-up" },
      { status: 400 },
    );
  const { data: s } = await a.db
    .from("service_providers")
    .select("id,listing_expires_at")
    .eq("id", p.data.provider_id)
    .eq("status", "active")
    .gt("vetting_expires_at", new Date().toISOString())
    .single();
  if (
    !s ||
    (s.listing_expires_at && Date.parse(s.listing_expires_at) < Date.now())
  )
    return NextResponse.json(
      { error: "Provider not currently available" },
      { status: 409 },
    );
  const { count } = await a.db
    .from("service_requests")
    .select("id", { count: "exact", head: true })
    .eq("requester_id", a.id)
    .gte("created_at", new Date(Date.now() - 3600000).toISOString());
  if ((count ?? 0) >= 5)
    return NextResponse.json({ error: "Too many enquiries" }, { status: 429 });
  const { data, error } = await a.db
    .from("service_requests")
    .insert({ ...p.data, requester_id: a.id })
    .select("id")
    .single();
  return error
    ? NextResponse.json({ error: "Could not save enquiry" }, { status: 400 })
    : NextResponse.json({ reference: data.id }, { status: 201 });
}
