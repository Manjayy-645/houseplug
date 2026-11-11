import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getVerificationDocuments } from "@/lib/storage";

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,banned,is_banned")
    .eq("id", user.id)
    .single();

  if (
    profile?.banned ||
    profile?.is_banned ||
    !["admin", "super_admin"].includes(profile?.role || "")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Landlord ID required" },
      { status: 400 },
    );
  }

  try {
    const urls = await getVerificationDocuments(id);
    return NextResponse.json({ urls });
  } catch (error: any) {
    console.error("[STORAGE_API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
