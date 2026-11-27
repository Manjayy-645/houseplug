import { UNIVERSITIES } from "./constants";

export type Editorial = {
  approved: boolean;
  reviewedAt?: string;
  intro?: string;
  advice?: string;
  faq?: { question: string; answer: string }[];
};

export type StateLocation = {
  slug: string;
  name: string;
  editorial: Editorial;
};

export type CityLocation = {
  slug: string;
  name: string;
  stateSlug: string;
};

export type UniversityLocation = {
  slug: string;
  campusId: string;
  stateSlug: string;
  citySlug: string;
  aliases: string[];
  editorial: Editorial;
  guideSlugs: string[];
};

export type NeighborhoodLocation = {
  slug: string;
  name: string;
  universitySlug: string;
  citySlug: string;
  listingArea: string;
  aliases: string[];
  editorial: Editorial;
};

const reviewedAt = "2026-11-27";

export const nationalEditorial: Editorial = {
  approved: true,
  reviewedAt,
  intro:
    "Explore student accommodation advertised near universities supported by HousePlug. Each room is an individual advertiser offer; a campus name does not establish travel time, price or availability for a particular property.",
  advice:
    "Compare the listed rent with any disclosed mandatory fees and ask the responsible agent to reconfirm availability before travelling. Students arrange inspections directly with agents or landlords.",
};

export const states: StateLocation[] = [
  {
    slug: "rivers",
    name: "Rivers State",
    editorial: {
      approved: true,
      reviewedAt,
      intro:
        "Browse HousePlug listings associated with universities in Rivers State. Check each property's own area, costs and availability before contacting its advertiser.",
      advice:
        "A listed neighbourhood does not guarantee a particular journey to campus. Confirm the property location and route directly with the agent.",
    },
  },
  { slug: "lagos", name: "Lagos State", editorial: { approved: false } },
  { slug: "oyo", name: "Oyo State", editorial: { approved: false } },
  { slug: "osun", name: "Osun State", editorial: { approved: false } },
  { slug: "enugu", name: "Enugu State", editorial: { approved: false } },
  { slug: "edo", name: "Edo State", editorial: { approved: false } },
  { slug: "kaduna", name: "Kaduna State", editorial: { approved: false } },
];

export const cities: CityLocation[] = [
  { slug: "port-harcourt", name: "Port Harcourt", stateSlug: "rivers" },
  { slug: "bori", name: "Bori", stateSlug: "rivers" },
  { slug: "lagos", name: "Lagos", stateSlug: "lagos" },
  { slug: "ibadan", name: "Ibadan", stateSlug: "oyo" },
  { slug: "ile-ife", name: "Ile-Ife", stateSlug: "osun" },
  { slug: "nsukka", name: "Nsukka", stateSlug: "enugu" },
  { slug: "benin-city", name: "Benin City", stateSlug: "edo" },
  { slug: "zaria", name: "Zaria", stateSlug: "kaduna" },
];

const campusLocation: Record<string, Omit<UniversityLocation, "campusId" | "slug">> = {
  uniport: {
    stateSlug: "rivers",
    citySlug: "port-harcourt",
    aliases: ["university-of-port-harcourt"],
    guideSlugs: ["uniport-accommodation", "uniport-hostel-prices"],
    editorial: {
      approved: true,
      reviewedAt,
      intro:
        "Compare HousePlug rooms listed for the University of Port Harcourt. Listings identify their own neighbourhood and price; check the actual route to the campus gate you use.",
      advice:
        "Review the room type, annual rent, first payment, house rules and occupancy permission. Ask the listing agent to confirm current availability and arrange any visit directly.",
      faq: [
        {
          question: "Is the listed rent the full move-in payment?",
          answer:
            "Not necessarily. Open the property to check its disclosed mandatory fees and first payment. If a charge is unconfirmed, ask the agent for an itemized amount.",
        },
        {
          question: "Does a neighbourhood name tell me how far the room is from UNIPORT?",
          answer:
            "No. Confirm the exact route and the relevant campus gate for the individual property before travelling.",
        },
      ],
    },
  },
  rsu: { stateSlug: "rivers", citySlug: "port-harcourt", aliases: ["rivers-state-university"], guideSlugs: [], editorial: { approved: false } },
  iaue: { stateSlug: "rivers", citySlug: "port-harcourt", aliases: ["ignatius-ajuru-university"], guideSlugs: [], editorial: { approved: false } },
  kenpoly: { stateSlug: "rivers", citySlug: "bori", aliases: ["ken-saro-wiwa-polytechnic"], guideSlugs: [], editorial: { approved: false } },
  unilag: { stateSlug: "lagos", citySlug: "lagos", aliases: ["university-of-lagos"], guideSlugs: [], editorial: { approved: false } },
  lasu: { stateSlug: "lagos", citySlug: "lagos", aliases: ["lagos-state-university"], guideSlugs: [], editorial: { approved: false } },
  yabatech: { stateSlug: "lagos", citySlug: "lagos", aliases: ["yaba-college-of-technology"], guideSlugs: [], editorial: { approved: false } },
  ui: { stateSlug: "oyo", citySlug: "ibadan", aliases: ["university-of-ibadan"], guideSlugs: [], editorial: { approved: false } },
  oau: { stateSlug: "osun", citySlug: "ile-ife", aliases: ["obafemi-awolowo-university"], guideSlugs: [], editorial: { approved: false } },
  unn: { stateSlug: "enugu", citySlug: "nsukka", aliases: ["university-of-nigeria-nsukka"], guideSlugs: [], editorial: { approved: false } },
  uniben: { stateSlug: "edo", citySlug: "benin-city", aliases: ["university-of-benin"], guideSlugs: [], editorial: { approved: false } },
  abu: { stateSlug: "kaduna", citySlug: "zaria", aliases: ["ahmadu-bello-university"], guideSlugs: [], editorial: { approved: false } },
};

export const universities: UniversityLocation[] = UNIVERSITIES.map((campus) => ({
  slug: campus.id,
  campusId: campus.id,
  ...campusLocation[campus.id],
}));

export const neighborhoods: NeighborhoodLocation[] = [
  {
    slug: "choba",
    name: "Choba",
    universitySlug: "uniport",
    citySlug: "port-harcourt",
    listingArea: "Choba",
    aliases: [],
    editorial: {
      approved: true,
      reviewedAt,
      intro:
        "See properties whose advertiser lists their area as Choba and associates them with UNIPORT. Compare the individual room's cost and route rather than assuming every Choba address is alike.",
      advice:
        "Ask for the exact meeting point and the campus gate used in any distance estimate. Confirm the room and shared facilities in person with the agent.",
    },
  },
  {
    slug: "alakahia",
    name: "Alakahia",
    universitySlug: "uniport",
    citySlug: "port-harcourt",
    listingArea: "Alakahia",
    aliases: [],
    editorial: {
      approved: true,
      reviewedAt,
      intro:
        "Browse UNIPORT listings whose recorded area is Alakahia. Use each property's details to compare rent, mandatory fees, occupancy and availability.",
      advice:
        "Check the actual route to the gate you use and ask who receives each payment before arranging a visit with the advertiser.",
    },
  },
  {
    slug: "aluu",
    name: "Aluu",
    universitySlug: "uniport",
    citySlug: "port-harcourt",
    listingArea: "Aluu",
    aliases: [],
    editorial: {
      approved: true,
      reviewedAt,
      intro:
        "Browse properties recorded in Aluu for UNIPORT students. A property's neighbourhood and advertised rent are starting points for comparing individual offers.",
      advice:
        "Confirm the route and transport you would use, the complete first payment and whether the advertised room is still available.",
    },
  },
];

export const stateBySlug = (slug: string) => states.find((x) => x.slug === slug);
export const cityBySlug = (slug: string) => cities.find((x) => x.slug === slug);
export const universityBySlug = (slug: string) =>
  universities.find((x) => x.slug === slug || x.aliases.includes(slug));
export const neighborhoodBySlug = (universitySlug: string, slug: string) =>
  neighborhoods.find(
    (x) => x.universitySlug === universitySlug && (x.slug === slug || x.aliases.includes(slug)),
  );
export const campusName = (id: string) => UNIVERSITIES.find((x) => x.id === id)?.name ?? id;

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function validateLocationRegistry(
  registry: {
    states: StateLocation[];
    cities: CityLocation[];
    universities: UniversityLocation[];
    neighborhoods: NeighborhoodLocation[];
  } = { states, cities, universities, neighborhoods },
): string[] {
  const errors: string[] = [];
  const unique = (values: string[], label: string) => {
    const seen = new Set<string>();
    for (const value of values) {
      const parts = value.split("/");
      const expectedParts = label === "city" || label === "neighborhood" ? 2 : 1;
      if (parts.length !== expectedParts || parts.some((part) => !slugPattern.test(part)))
        errors.push(`Invalid ${label} slug: ${value}`);
      if (seen.has(value)) errors.push(`Duplicate ${label} slug: ${value}`);
      seen.add(value);
    }
  };
  unique(registry.states.map((x) => x.slug), "state");
  unique(registry.cities.map((x) => `${x.stateSlug}/${x.slug}`), "city");
  unique(registry.universities.flatMap((x) => [x.slug, ...x.aliases]), "university");
  unique(registry.neighborhoods.flatMap((x) => [`${x.universitySlug}/${x.slug}`, ...x.aliases.map((alias) => `${x.universitySlug}/${alias}`)]), "neighborhood");
  const stateIds = new Set(registry.states.map((x) => x.slug));
  const cityIds = new Set(registry.cities.map((x) => `${x.stateSlug}/${x.slug}`));
  const universityIds = new Set(registry.universities.flatMap((x) => [x.slug, ...x.aliases]));
  for (const state of registry.states)
    if (universityIds.has(state.slug)) errors.push(`State/university route collision: ${state.slug}`);
  for (const city of registry.cities)
    if (!stateIds.has(city.stateSlug)) errors.push(`Unknown state for city ${city.slug}`);
  for (const u of registry.universities) {
    if (!campusLocation[u.campusId]) errors.push(`Missing campus mapping: ${u.campusId}`);
    if (!stateIds.has(u.stateSlug)) errors.push(`Unknown state for ${u.slug}`);
    if (!cityIds.has(`${u.stateSlug}/${u.citySlug}`)) errors.push(`Unknown city for ${u.slug}`);
    const campus = UNIVERSITIES.find((x) => x.id === u.campusId);
    if (!campus || campus.state !== registry.states.find((x) => x.slug === u.stateSlug)?.name)
      errors.push(`Campus state mismatch: ${u.slug}`);
  }
  for (const n of registry.neighborhoods) {
    const u = registry.universities.find((x) => x.slug === n.universitySlug);
    if (!u || u.citySlug !== n.citySlug) errors.push(`Neighborhood association mismatch: ${n.slug}`);
    if (!n.listingArea.trim()) errors.push(`Missing listing area: ${n.slug}`);
  }
  return errors;
}

export function listingMatchesLocation(
  listing: { university: string; area: string },
  university: UniversityLocation,
  neighborhood?: NeighborhoodLocation,
) {
  return listing.university === university.campusId &&
    (!neighborhood ||
      (neighborhood.universitySlug === university.slug &&
        listing.area.trim().toLowerCase() === neighborhood.listingArea.toLowerCase()));
}

export const MIN_LOCATION_LISTINGS = 2;
export const isUniversityIndexable = (u: UniversityLocation, count: number) =>
  u.editorial.approved && Boolean(u.editorial.reviewedAt && u.editorial.intro && u.editorial.advice) && count >= MIN_LOCATION_LISTINGS;
export const isNeighborhoodIndexable = (n: NeighborhoodLocation, count: number, parentIndexable: boolean) =>
  parentIndexable && n.editorial.approved && Boolean(n.editorial.reviewedAt && n.editorial.intro && n.editorial.advice) && count >= MIN_LOCATION_LISTINGS;
export const isStateIndexable = (state: StateLocation, qualifyingCampuses: number) =>
  state.editorial.approved && Boolean(state.editorial.reviewedAt && state.editorial.intro && state.editorial.advice) && qualifyingCampuses >= 2;
export const isNationalIndexable = (qualifyingStates: number) =>
  nationalEditorial.approved && Boolean(nationalEditorial.reviewedAt && nationalEditorial.intro && nationalEditorial.advice) && qualifyingStates >= 2;

export function locationBreadcrumb(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `https://www.houseplug.ng${item.path}`,
    })),
  };
}
