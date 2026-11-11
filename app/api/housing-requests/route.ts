import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { housingRequestSchema, attributionToken } from "@/lib/request-schema";
import { featureFlags } from "@/lib/feature-flags";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sameOrigin } from "@/lib/request-auth";
export async function POST(request: Request) {
  if (!featureFlags.housingRequests)
    return NextResponse.json(
      {
        error:
          "Housing request intake is not available yet. Browse rooms and contact advertisers directly.",
      },
      { status: 503 },
    );
  if (!sameOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const key = process.env.HOUSING_REQUEST_HASH_KEY;
  if (!key)
    return NextResponse.json(
      { error: "Request intake is temporarily unavailable" },
      { status: 503 },
    );
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = housingRequestSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  const { website, ...p } = parsed.data;
  const {
    data: { user },
  } = await createClient().auth.getUser();
  if (user) {
    const { data: profile } = await createClient()
      .from("profiles")
      .select("banned,is_banned")
      .eq("id", user.id)
      .single();
    if (profile?.banned || profile?.is_banned)
      return NextResponse.json({ error: "Account suspended" }, { status: 403 });
  }
  if (p.referral_code) {
    const { data: r } = await createServiceClient()
      .from("referral_codes")
      .select("code,campaign,expires_at")
      .eq("code", p.referral_code)
      .eq("active", true)
      .single();
    if (!r || (r.expires_at && Date.parse(r.expires_at) <= Date.now()))
      p.referral_code = undefined;
    else {
      p.source = "referral";
      p.medium = "ambassador";
      p.campaign = r.campaign;
    }
  }
  const hash = (s: string) => createHmac("sha256", key).update(s).digest("hex");
  // Session-based identity remains private. Contact details never enter analytics.
  const fingerprint = hash(
    [
      p.contact_phone.replace(/^0/, "234"),
      p.university,
      p.listing_id ?? "",
      p.move_in_date,
      p.total_budget,
    ].join(":"),
  );
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const { data, error } = await createServiceClient().rpc(
    "create_housing_request",
    {
      payload: {
        ...p,
        user_id: user?.id ?? null,
        contact_email: p.contact_email || null,
        source: attributionToken(p.source),
        medium: attributionToken(p.medium),
        campaign: attributionToken(p.campaign),
        content_code: attributionToken(p.content_code),
        referral_code: attributionToken(p.referral_code),
      },
      request_fingerprint: fingerprint,
      rate_key: hash(ip),
    },
  );
  if (error)
    return NextResponse.json(
      {
        error:
          error.code === "54000"
            ? "Too many requests. Please try later."
            : "We could not save your request. Check availability or try again.",
      },
      { status: error.code === "54000" ? 429 : 400 },
    );
  const saved = data?.[0];
  if (!saved)
    return NextResponse.json(
      { error: "Request was not saved" },
      { status: 500 },
    );
  return NextResponse.json(
    {
      reference: saved.reference,
      message:
        "Request saved. HousePlug connects students with advertisers. Arrange any inspection directly with the landlord or agent.",
    },
    { status: 201 },
  );
}
