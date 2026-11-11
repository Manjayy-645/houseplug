import { sameOrigin } from "@/lib/request-auth";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error } = await adminSupabase.auth.admin.deleteUser(user.id);

  if (error) {
    return NextResponse.json(
      {
        error:
          "Account deletion could not be completed. Contact support for a privacy request.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
