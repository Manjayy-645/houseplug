import { NextResponse } from "next/server";
import { requestActor } from "@/lib/request-auth";
export async function GET() {
  const a = await requestActor();
  if (!a)
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const [profile, housing, roommate, reports] = await Promise.all([
    a.db
      .from("profiles")
      .select(
        "id,email,full_name,phone,role,ndpa_consent,ndpa_consent_at,marketing_opt_in",
      )
      .eq("id", a.id)
      .single(),
    a.db
      .from("housing_requests")
      .select(
        "reference,university,area,total_budget,move_in_date,status,contact_name,contact_phone,contact_email,contact_consent,marketing_consent,created_at",
      )
      .eq("user_id", a.id),
    a.db.from("roommate_profiles").select("*").eq("user_id", a.id),
    a.db
      .from("reports")
      .select("category,description,status,created_at,resolution")
      .eq("reporter_id", a.id),
  ]);
  return NextResponse.json(
    {
      profile: profile.data,
      housing_requests: housing.data,
      roommate_profiles: roommate.data,
      reports: reports.data,
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition":
          "attachment; filename=houseplug-personal-data.json",
      },
    },
  );
}
