import "server-only";
import { cache } from "react";
import { inventoryQuery } from "@/lib/public-inventory";
import type { Listing } from "@/types";
import {
  isNeighborhoodIndexable,
  isStateIndexable,
  isUniversityIndexable,
  listingMatchesLocation,
  neighborhoods,
  states,
  universities,
  type NeighborhoodLocation,
  type UniversityLocation,
} from "@/lib/seo-locations";

// Display active advertised rooms with their existing truth disclosures, but
// qualify a page for indexing only using explicitly reconfirmed inventory.
export async function loadLocationListings(
  university: UniversityLocation,
  neighborhood?: NeighborhoodLocation,
  limit = 12,
): Promise<{ listings: Listing[]; count: number; confirmedCount: number; error: boolean }> {
  let displayQuery = inventoryQuery()
    .eq("university", university.campusId)
    .order("last_confirmed_at", { ascending: false })
    .limit(limit);
  let confirmedQuery = inventoryQuery()
    .eq("university", university.campusId)
    .eq("legacy_inventory", false)
    .neq("whatsapp_number", "")
    .limit(1);
  if (neighborhood) {
    displayQuery = displayQuery.ilike("area", neighborhood.listingArea);
    confirmedQuery = confirmedQuery.ilike("area", neighborhood.listingArea);
  }
  const [display, confirmed] = await Promise.all([displayQuery, confirmedQuery]);
  return {
    listings: display.error
      ? []
      : ((display.data ?? []) as Listing[]).filter((listing) =>
          listingMatchesLocation(listing, university, neighborhood),
        ),
    count: display.error ? 0 : (display.count ?? 0),
    confirmedCount: confirmed.error ? 0 : (confirmed.count ?? 0),
    error: Boolean(display.error || confirmed.error),
  };
}

export const loadLocationSnapshot = cache(async () => {
  const approved = universities.filter((u) => u.editorial.approved);
  const results = await Promise.all(
    approved.map(async (university) => ({
      university,
      inventory: await loadLocationListings(university, undefined, 6),
    })),
  );
  const availableUniversities = results.filter(
    ({ inventory }) => !inventory.error && inventory.count > 0,
  );
  const qualifyingUniversities = results.filter(
    ({ university, inventory }) =>
      !inventory.error && isUniversityIndexable(university, inventory.confirmedCount),
  );
  const qualifyingStates = states.filter((state) =>
    isStateIndexable(
      state,
      qualifyingUniversities.filter(
        ({ university }) => university.stateSlug === state.slug,
      ).length,
    ),
  );
  return { availableUniversities, qualifyingUniversities, qualifyingStates };
});

export const loadNeighborhoodSnapshot = cache(
  async (universitySlug: string, neighborhoodSlug: string) => {
    const university = universities.find((u) => u.slug === universitySlug);
    const neighborhood = neighborhoods.find(
      (n) => n.universitySlug === universitySlug && n.slug === neighborhoodSlug,
    );
    if (!university || !neighborhood) return null;
    const [campusInventory, inventory] = await Promise.all([
      loadLocationListings(university, undefined, 1),
      loadLocationListings(university, neighborhood),
    ]);
    const parentIndexable =
      !campusInventory.error &&
      isUniversityIndexable(university, campusInventory.confirmedCount);
    return {
      university,
      neighborhood,
      inventory,
      indexable:
        !inventory.error &&
        isNeighborhoodIndexable(neighborhood, inventory.confirmedCount, parentIndexable),
    };
  },
);
