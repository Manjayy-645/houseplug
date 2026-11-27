# National location SEO policy

## Source of truth

The Next.js location registry in `lib/seo-locations.ts` maps states, cities, universities and neighbourhoods. University IDs come from the existing `UNIVERSITIES` constant. A neighbourhood joins listings by its university ID and an exact, case-insensitive `area` match; aliases are URL redirects, not additional pages. The registry validator rejects duplicate slugs, route collisions and broken associations.

There is no database migration. This keeps the rollout independent of production schema changes. Listing prices, rent basis, mandatory fees, availability and verification remain in the existing listings table and existing card/detail components. New location pages use the established public inventory filter and public listing projection. No market averages, inferred availability, fabricated reviews or exact private addresses are generated.

The new pages render on the server and reuse existing cards; they add no client-side data fetch or third-party script. No broader Core Web Vitals change is proposed without field measurements showing a specific problem.

## Publication rule

The registry carries explicit `approved`, `reviewedAt`, introduction and advice fields. Only copy based on existing HousePlug guidance and recorded location labels is approved initially. Other campuses are configured but unpublished until their copy is reviewed.

At request time:

- A university page is indexable only with approved copy and at least **two currently reconfirmed, contactable** listings.
- A neighbourhood page additionally needs an indexable parent university and two reconfirmed listings matching that exact area.
- A state page needs approved copy and at least two qualifying universities in that state.
- The national page needs approved copy and at least two qualifying states.
- Errors fetching inventory fail closed for indexing. Active historical listings can still appear with their existing uncertainty disclosures, but they do not satisfy the confirmed-inventory threshold.

Noindex pages are omitted from the dynamic sitemap. Unknown and unpublished slugs return an early HTTP 404 with noindex; aliases and old `/student-housing/uniport` routes redirect to canonical university URLs. Existing unapproved campus routes remain usable but noindex. Search facets on `/browse` remain outside the sitemap, and listing URLs remain unchanged.

On **27 November 2026**, a read-only inventory aggregation found active advertised rooms for UNIPORT and RSU but zero listings satisfying the recorded reconfirmation dates. Therefore the new location pages are expected to remain noindex until listings are genuinely reconfirmed in the existing product workflow. No database dates were filled in for this release.

## Editorial and expansion workflow

1. Verify the university and state association from a reliable source. Add or review its registry mapping, aliases and genuinely useful local guidance.
2. Obtain editorial approval, then set `approved: true` and a real review date in code. Avoid unsupported local claims and copied template paragraphs.
3. Confirm listing university, exact area, availability, rent basis and mandatory fees through the existing listing process. Do not approve missing occupancy or verification evidence by inference.
4. Check the location page and sitemap at production and preview domains. Confirm noindex becomes index only when the documented threshold is met.
5. Add guides through the existing reviewed/published `content_pages` controls or code review a static guide. The `/guides` hub lists only reviewed, published content.

Prioritize UNIPORT and its recorded neighbourhoods, then RSU, IAUE and KenPoly when their inventory and editorial copy qualify. Other configured universities have no public SEO pages until they pass the same checks.

## Rollout and rollback

Merge the PR after CI and editorial review. The branch has Vercel deployment disabled for review. The release requires no production migration or data backfill. If search or routing behaves unexpectedly, revert this PR; legacy listing and browse URLs stay intact. Confirm the sitemap and redirect destinations after rollback. The sitemap reads eligible listing URLs in 1,000-row batches up to 45,000 listings; split it into multiple sitemaps before that limit is reached.

Visual baseline: `docs/evidence/national-seo-baseline-{375,768,1440}.jpg` captures the existing UNIPORT page on `www.houseplug.ng`. The browser suite creates `test-results/national-seo-after-{375,768,1440}.jpg` from the new page. The baseline uses live listings and the new-page captures use disposable fixture listings, so compare layout and styling rather than inventory volume or image coverage.
