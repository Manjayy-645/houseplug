export type FeeItem = {
  type: string;
  label: string;
  amount: number | null;
  mandatory: boolean;
  refundable: boolean;
  recipient?: string;
  period?: string;
};
export type HousingTruth = {
  status?: string;
  price_yearly?: number;
  fee_items?: FeeItem[];
  fees_complete?: boolean;
  renewal_amount?: number | null;
  price_basis?: "unconfirmed" | "per_bed" | "per_room" | "per_unit";
  rent_term_months?: number | null;
  last_fee_verified_at?: string | null;
  total_initial_payment?: number | null;
  sharing_allowed?: boolean;
  occupancy?: number;
  availability_state?: string;
  legacy_inventory?: boolean;
  last_confirmed_at?: string | null;
  availability_expires_at?: string | null;
  media_confirmed_at?: string | null;
  authority_checked_at?: string | null;
  physically_inspected_at?: string | null;
  evidence_expires_at?: string | null;
};
export function moveInTotal(listing: HousingTruth): number | null {
  if (
    !listing.fees_complete ||
    !Number.isSafeInteger(listing.price_yearly) ||
    listing.price_yearly! < 0
  )
    return null;
  let total = listing.price_yearly!;
  for (const fee of listing.fee_items ?? []) {
    if (!fee.mandatory || fee.type === "inspection") continue;
    if (
      fee.amount === null ||
      !Number.isSafeInteger(fee.amount) ||
      fee.amount < 0
    )
      return null;
    total += fee.amount;
  }
  return Number.isSafeInteger(total) ? total : null;
}
export function sharingEligible(listing: HousingTruth, people = 2): boolean {
  return (
    listing.sharing_allowed === true &&
    listing.price_basis === "per_unit" &&
    listing.rent_term_months === 12 &&
    Number.isInteger(people) &&
    people >= 2 &&
    Number.isInteger(listing.occupancy) &&
    listing.occupancy! >= people
  );
}
export function currentAvailability(
  listing: HousingTruth,
  now = Date.now(),
): boolean {
  const checked = Date.parse(listing.last_confirmed_at ?? "");
  const expiry = Date.parse(listing.availability_expires_at ?? "");
  return (
    listing.status === "active" &&
    listing.availability_state === "active" &&
    Number.isFinite(checked) &&
    checked <= now &&
    expiry > now
  );
}
export function publicContactAvailable(listing: HousingTruth, now = Date.now()): boolean {
  return currentAvailability(listing, now) || (
    listing.status === "active" &&
    listing.availability_state === "active" &&
    listing.legacy_inventory === true &&
    !listing.last_confirmed_at
  );
}
export function promotionEligible(
  listing: HousingTruth,
  now = Date.now(),
): boolean {
  return (
    currentAvailability(listing, now) &&
    moveInTotal(listing) !== null &&
    !!listing.media_confirmed_at &&
    !!listing.authority_checked_at &&
    Date.parse(listing.evidence_expires_at ?? "") > now
  );
}
export function verificationLabels(
  listing: HousingTruth,
  now = Date.now(),
): string[] {
  if (!(Date.parse(listing.evidence_expires_at ?? "") > now)) return [];
  return [
    listing.authority_checked_at ? "Authority to list checked" : "",
    listing.physically_inspected_at ? "Property physically inspected" : "",
  ].filter(Boolean);
}
export function publicStudentName(name?: string | null): string {
  return name?.trim().split(/\s+/)[0] || "Student";
}
