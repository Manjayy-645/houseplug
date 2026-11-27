import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cities,
  isNationalIndexable,
  isNeighborhoodIndexable,
  isStateIndexable,
  isUniversityIndexable,
  listingMatchesLocation,
  locationBreadcrumb,
  neighborhoods,
  states,
  universities,
  validateLocationRegistry,
} from "../lib/seo-locations";
import { parseBrowsePage } from "../lib/seo-pagination";

test("location registry has unique slugs and valid state, city and campus associations", () => {
  assert.deepEqual(validateLocationRegistry(), []);
  assert.ok(universities.some((u) => u.slug === "uniport" && u.stateSlug === "rivers"));
  assert.ok(neighborhoods.some((n) => n.slug === "aluu" && n.universitySlug === "uniport"));
});

test("invalid and duplicate slugs, aliases and associations are rejected", () => {
  const duplicate = validateLocationRegistry({
    states,
    cities,
    universities: [...universities, { ...universities[0], slug: "rsu", aliases: ["bad slug"] }],
    neighborhoods: [...neighborhoods, { ...neighborhoods[0], slug: "aluu" }],
  });
  assert.ok(duplicate.some((x) => x.includes("Duplicate university slug: rsu")));
  assert.ok(duplicate.some((x) => x.includes("Invalid university slug: bad slug")));
  assert.ok(duplicate.some((x) => x.includes("Duplicate neighborhood slug: uniport/aluu")));
  const invalidState = validateLocationRegistry({
    states,
    cities,
    universities: [{ ...universities[0], stateSlug: "unknown" }, ...universities.slice(1)],
    neighborhoods,
  });
  assert.ok(invalidState.some((x) => x.includes("Unknown state for uniport")));
  const invalidPath = validateLocationRegistry({
    states: [{ ...states[0], slug: "rivers/extra" }, ...states.slice(1)],
    cities,
    universities,
    neighborhoods,
  });
  assert.ok(invalidPath.some((x) => x.includes("Invalid state slug: rivers/extra")));
});

test("approval and two confirmed rooms gate university and neighborhood indexing", () => {
  const uniport = universities.find((u) => u.slug === "uniport")!;
  const rsu = universities.find((u) => u.slug === "rsu")!;
  const aluu = neighborhoods.find((n) => n.slug === "aluu")!;
  assert.equal(isUniversityIndexable(uniport, 0), false);
  assert.equal(isUniversityIndexable(uniport, 1), false);
  assert.equal(isUniversityIndexable(uniport, 2), true);
  assert.equal(isUniversityIndexable(rsu, 20), false);
  assert.equal(isNeighborhoodIndexable(aluu, 20, false), false);
  assert.equal(isNeighborhoodIndexable(aluu, 1, true), false);
  assert.equal(isNeighborhoodIndexable(aluu, 2, true), true);
});

test("state and national pages require distinct qualifying campuses and states", () => {
  const rivers = states.find((s) => s.slug === "rivers")!;
  const lagos = states.find((s) => s.slug === "lagos")!;
  assert.equal(isStateIndexable(rivers, 1), false);
  assert.equal(isStateIndexable(rivers, 2), true);
  assert.equal(isStateIndexable(lagos, 3), false);
  assert.equal(isNationalIndexable(1), false);
  assert.equal(isNationalIndexable(2), true);
});

test("neighborhood listing association is exact and campus-specific", () => {
  const uniport = universities.find((u) => u.slug === "uniport")!;
  const aluu = neighborhoods.find((n) => n.slug === "aluu")!;
  assert.equal(listingMatchesLocation({ university: "uniport", area: " ALUU " }, uniport, aluu), true);
  assert.equal(listingMatchesLocation({ university: "uniport", area: "Aluu North" }, uniport, aluu), false);
  assert.equal(listingMatchesLocation({ university: "rsu", area: "Aluu" }, uniport, aluu), false);
});

test("breadcrumb schema uses canonical URLs without listing or contact data", () => {
  const schema = locationBreadcrumb([
    { name: "Home", path: "/" },
    { name: "UNIPORT", path: "/university/uniport" },
  ]);
  assert.equal(schema["@type"], "BreadcrumbList");
  assert.equal(schema.itemListElement[1].item, "https://www.houseplug.ng/university/uniport");
  assert.equal(JSON.stringify(schema).includes("phone"), false);
});

test("faceted browse pagination rejects non-canonical and excessive page values", () => {
  assert.deepEqual(parseBrowsePage(undefined), { page: 1, valid: true });
  assert.deepEqual(parseBrowsePage("2"), { page: 2, valid: true });
  for (const value of ["0", "-1", "02", "1.5", "Infinity", "10001", "abc"])
    assert.deepEqual(parseBrowsePage(value), { page: 1, valid: false });
});
