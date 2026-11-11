import { publicContactAvailable } from "@/lib/housing";
import type { Listing, Profile } from "@/types";
// Explicit allowlist: internal review notes and future database fields never reach client props.
const fields = [
  "id",
  "landlord_id",
  "title",
  "description",
  "room_type",
  "price_yearly",
  "distance_from_gate",
  "area",
  "landmark",
  "amenities",
  "photos",
  "status",
  "is_featured",
  "show_on_home",
  "is_urgent",
  "whatsapp_number",
  "phone_number",
  "available_from",
  "occupancy",
  "furnishing",
  "floor",
  "views_count",
  "whatsapp_clicks",
  "university",
  "agent_fee_type",
  "agent_fee_amount",
  "video_url",
  "is_saved",
  "created_at",
  "fee_items",
  "fees_complete",
  "total_initial_payment",
  "renewal_amount",
  "price_basis",
  "rent_term_months",
  "sharing_allowed",
  "last_confirmed_at",
  "availability_state",
  "legacy_inventory",
  "availability_expires_at",
  "media_confirmed_at",
  "authority_checked_at",
  "physically_inspected_at",
  "evidence_expires_at",
  "last_fee_verified_at",
  "reviews",
] as const;
export function publicListing(row: Listing): Listing {
  const out: Record<string, unknown> = {};
  for (const k of fields)
    if (k in row) out[k] = (row as unknown as Record<string, unknown>)[k];
  // These are advertiser-supplied listing contacts, never private account contacts.
  // Owner/admin previews of unpublished or stale inventory do not publish contacts.
  if (!publicContactAvailable(row)) {
    out.whatsapp_number = "";
    out.phone_number = "";
  }
  out.address = row.area;
  const p = row.landlord;
  if (p)
    out.landlord = {
      id: p.id,
      full_name: p.full_name,
      role: p.role,
      avatar_url: p.avatar_url,
      verification_status: p.verification_status,
      username: p.username,
      created_at: p.created_at,
    } as Profile;
  return out as Listing;
}
