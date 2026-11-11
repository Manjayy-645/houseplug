import { guides } from "@/lib/guides";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requestActor, sameOrigin } from "@/lib/request-auth";
const schema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(100),
  title: z.string().trim().min(10).max(160),
  body: z.string().trim().min(400).max(30000),
  author: z.string().trim().min(2).max(100),
  publish: z.boolean(),
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
      { error: p.error.issues[0].message },
      { status: 400 },
    );
  if (guides[p.data.slug])
    return NextResponse.json(
      { error: "That guide already exists. Choose a new slug." },
      { status: 409 },
    );
  const { publish, ...fields } = p.data;
  const now = new Date().toISOString();
  const { error } = await a.db
    .from("content_pages")
    .upsert(
      {
        ...fields,
        updated_at: now,
        reviewed_at: publish ? now : null,
        reviewed_by: publish ? a.id : null,
        published_at: publish ? now : null,
      },
      { onConflict: "slug" },
    );
  return NextResponse.json({ success: !error }, { status: error ? 400 : 200 });
}
