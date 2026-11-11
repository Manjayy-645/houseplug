import { NextResponse } from "next/server";
import { z } from "zod";
import { requestActor, sameOrigin } from "@/lib/request-auth";
const schema = z.object({
  action: z.enum([
    "request",
    "accept",
    "decline",
    "revoke",
    "block",
    "contact",
  ]),
  target_user_id: z.string().uuid(),
});
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const a = await requestActor();
  if (!a || a.role !== "student")
    return NextResponse.json(
      { error: "Sign in as a student" },
      { status: 403 },
    );
  const p = schema.safeParse(await request.json().catch(() => null));
  if (!p.success || p.data.target_user_id === a.id)
    return NextResponse.json({ error: "Invalid connection" }, { status: 400 });
  const { data, error } = await a.db.rpc("manage_roommate_connection", {
    actor_id: a.id,
    target_id: p.data.target_user_id,
    action: p.data.action,
  });
  return error
    ? NextResponse.json(
        {
          error:
            "Connection unavailable. It may be blocked, expired or awaiting acceptance.",
        },
        { status: 400 },
      )
    : NextResponse.json({
        success: true,
        contact: p.data.action === "contact" ? data : null,
      });
}
