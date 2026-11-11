import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";
export async function GET(
  request: Request,
  { params }: { params: { code: string } },
) {
  const u = new URL("/housing-assistance", SITE_URL);
  if (!/^[a-z0-9_-]{3,40}$/.test(params.code))
    return new NextResponse("Not found", { status: 404 });
  const { data: r } = await createServiceClient()
    .from("referral_codes")
    .select("code,campaign,expires_at")
    .eq("code", params.code)
    .eq("active", true)
    .single();
  if (!r || (r.expires_at && Date.parse(r.expires_at) <= Date.now()))
    return new NextResponse("Not found", { status: 404 });
  u.searchParams.set("utm_source", "referral");
  u.searchParams.set("utm_medium", "ambassador");
  u.searchParams.set("utm_campaign", r.campaign);
  u.searchParams.set("ref", r.code);
  return NextResponse.redirect(u, 302);
}
