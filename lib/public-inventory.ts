import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
export function inventoryQuery() {
  return createServiceClient()
    .from("listings")
    .select(
      "*,landlord:profiles!landlord_id!inner(id,full_name,avatar_url,verification_status,role,username,created_at)",
      { count: "exact" },
    )
    .eq("status", "active")
    .eq("landlord.banned", false)
    .eq("landlord.is_banned", false)
    .in("landlord.role", ["landlord", "agent"])
    .eq("availability_state", "active")
    .or(`and(legacy_inventory.eq.true,last_confirmed_at.is.null),and(last_confirmed_at.lte.${new Date().toISOString()},availability_expires_at.gt.${new Date().toISOString()})`);
}

export async function eligibleCampusCount(campus: string) {
  const { count } = await createServiceClient()
    .from("listings")
    .select("id,landlord:profiles!landlord_id!inner(id)", {
      count: "exact",
      head: true,
    })
    .eq("landlord.banned", false)
    .eq("landlord.is_banned", false)
    .in("landlord.role", ["landlord", "agent"])
    .eq("university", campus)
    .eq("status", "active")
    .eq("availability_state", "active")
    .or(`and(legacy_inventory.eq.true,last_confirmed_at.is.null),and(last_confirmed_at.lte.${new Date().toISOString()},availability_expires_at.gt.${new Date().toISOString()})`);
  return count ?? 0;
}
