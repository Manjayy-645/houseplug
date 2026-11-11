import "server-only";
import { originMatchesHost } from "@/lib/site";
import { createClient, createServiceClient } from "@/lib/supabase/server";
export async function requestActor() {
  const client = createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;
  const { data: profile } = await client
    .from("profiles")
    .select("role,banned,is_banned")
    .eq("id", user.id)
    .single();
  if (!profile || profile.banned || profile.is_banned) return null;
  return {
    id: user.id,
    role: profile.role as string,
    admin: ["admin", "super_admin"].includes(profile.role),
    db: createServiceClient(),
  };
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return originMatchesHost(
    origin,
    request.headers.get("host") ?? new URL(request.url).host,
    new URL(request.url).protocol,
  );
}
