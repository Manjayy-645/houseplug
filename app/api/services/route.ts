import { NextResponse } from "next/server";
import { requestActor, sameOrigin } from "@/lib/request-auth";
import { serviceSubmissionSchema } from "@/lib/service-submission";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const actor = await requestActor();
  if (!actor) return NextResponse.json({ error: "Sign in to list a service" }, { status: 401 });
  const parsed = serviceSubmissionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const { id, ...fields } = parsed.data;
  if (id) {
    const { data: existing } = await actor.db.from("service_providers").select("id,user_id").eq("id", id).single();
    if (!existing || existing.user_id !== actor.id) return NextResponse.json({ error: "Service unavailable" }, { status: 404 });
    const { error } = await actor.db.from("service_providers").update({ ...fields, status: "pending", vetted_at: null, vetting_expires_at: null, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", actor.id);
    return error ? NextResponse.json({ error: "Could not update service" }, { status: 400 }) : NextResponse.json({ id, status: "pending" });
  }
  const { count } = await actor.db.from("service_providers").select("id", { count: "exact", head: true }).eq("user_id", actor.id).in("status", ["active", "pending"]);
  if ((count ?? 0) >= 5) return NextResponse.json({ error: "You can manage up to five active or pending services" }, { status: 429 });
  const { data, error } = await actor.db.from("service_providers").insert({ ...fields, user_id: actor.id, status: "pending", is_student_owned: actor.role === "student", listing_paid: false, is_verified: false }).select("id").single();
  return error ? NextResponse.json({ error: "Could not submit service" }, { status: 400 }) : NextResponse.json({ id: data.id, status: "pending" }, { status: 201 });
}
