import { NextResponse } from "next/server";
import { z } from "zod";
import { requestActor, sameOrigin } from "@/lib/request-auth";
const schema = z.object({
  listing_id: z.string().uuid().optional(),
  target_user_id: z.string().uuid().optional(),
  service_id: z.string().uuid().optional(),
  category: z.enum([
    "pricing",
    "availability",
    "fraud",
    "harassment",
    "images",
    "service",
    "other",
  ]),
  description: z.string().trim().min(20).max(2000),
});
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const a = await requestActor();
  if (!a)
    return NextResponse.json(
      { error: "Sign in to submit a report" },
      { status: 401 },
    );
  const p = schema.safeParse(await request.json().catch(() => null));
  if (!p.success)
    return NextResponse.json(
      { error: "Add a category and at least 20 characters" },
      { status: 400 },
    );
  const { count } = await a.db
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("reporter_id", a.id)
    .gte("created_at", new Date(Date.now() - 3600000).toISOString());
  if ((count ?? 0) >= 5)
    return NextResponse.json(
      { error: "Too many reports; try later" },
      { status: 429 },
    );
  const { data, error } = await a.db
    .from("reports")
    .insert({ ...p.data, reporter_id: a.id })
    .select("id")
    .single();
  return error
    ? NextResponse.json({ error: "Report could not be saved" }, { status: 400 })
    : NextResponse.json({ reference: data.id }, { status: 201 });
}
