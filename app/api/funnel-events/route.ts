import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { sameOrigin } from "@/lib/request-auth";
const schema = z
  .object({
    event: z.enum([
      "homepage_search",
      "campus_view",
      "listing_view",
      "filter_apply",
      "housing_request_started",
      "whatsapp_click",
    ]),
    session_id: z.string().uuid(),
    listing_id: z.string().uuid().optional(),
    university: z
      .string()
      .regex(/^[a-z_]+$/)
      .max(40)
      .optional(),
  })
  .strict();
export async function POST(request: Request) {
  if (process.env.HOUSING_ANALYTICS_ENABLED !== "true")
    return new NextResponse(null, { status: 204 });
  if (!sameOrigin(request)) return new NextResponse(null, { status: 403 });
  const p = schema.safeParse(await request.json().catch(() => null));
  if (!p.success) return new NextResponse(null, { status: 400 });
  const d = p.data;
  const key = [
    d.session_id,
    d.event,
    d.listing_id ?? d.university ?? "",
    new Date().toISOString().slice(0, 10),
  ].join(":");
  const { error } = await createServiceClient()
    .from("funnel_events")
    .upsert(
      { ...d, dedupe_key: key },
      { onConflict: "dedupe_key", ignoreDuplicates: true },
    );
  return new NextResponse(null, { status: error ? 503 : 204 });
}
