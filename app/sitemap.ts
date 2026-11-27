import { guides } from "@/lib/guides";
import { SITE_URL } from "@/lib/site";
import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/server";
import { sitemapInventoryQuery } from "@/lib/public-inventory";
import { isNationalIndexable, neighborhoods } from "@/lib/seo-locations";
import { loadLocationSnapshot, loadNeighborhoodSnapshot } from "@/lib/seo-inventory";

export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    "",
    "/browse",
    "/roommates",
    "/safety",
    "/about",
    "/contact",
    "/terms",
    "/privacy",
    "/guides",
  ].map((path) => ({ url: SITE_URL + path }));
  const knownGuides = new Set(Object.keys(guides));
  for (const slug of knownGuides)
    routes.push({
      url: `${SITE_URL}/guides/${slug}`,
      lastModified: new Date("2026-11-11"),
    });
  try {
    const { data: content } = await createServiceClient()
        .from("content_pages")
        .select("slug,updated_at")
        .lte("published_at", new Date().toISOString())
        .not("reviewed_at", "is", null);
    // Supabase caps a response at 1,000 rows by default. Read successive
    // batches so expansion does not silently drop properties after row 2,000.
    for (let offset = 0; offset < 45000; offset += 1000) {
      const { data: listings, error } = await sitemapInventoryQuery()
        .order("updated_at", { ascending: false })
        .order("id", { ascending: true })
        .range(offset, offset + 999);
      if (error) break;
      for (const listing of listings ?? [])
        routes.push({
          url: `${SITE_URL}/listing/${listing.id}`,
          lastModified: listing.updated_at
            ? new Date(listing.updated_at)
            : undefined,
        });
      if (!listings || listings.length < 1000) break;
    }
    for (const c of content ?? [])
      if (!knownGuides.has(c.slug))
        routes.push({
          url: `${SITE_URL}/guides/${c.slug}`,
          lastModified: c.updated_at ? new Date(c.updated_at) : undefined,
        });
    const snapshot = await loadLocationSnapshot();
    if (isNationalIndexable(snapshot.qualifyingStates.length))
      routes.push({ url: `${SITE_URL}/student-housing-nigeria` });
    for (const state of snapshot.qualifyingStates)
      routes.push({ url: `${SITE_URL}/student-housing/${state.slug}` });
    for (const { university } of snapshot.qualifyingUniversities) {
      routes.push({ url: `${SITE_URL}/university/${university.slug}` });
      for (const neighborhood of neighborhoods.filter(
        (n) => n.universitySlug === university.slug && n.editorial.approved,
      )) {
        const detail = await loadNeighborhoodSnapshot(university.slug, neighborhood.slug);
        if (detail?.indexable)
          routes.push({
            url: `${SITE_URL}/university/${university.slug}/${neighborhood.slug}`,
          });
      }
    }
  } catch {
    /* Static canonical routes remain available during database outages. */
  }
  return routes;
}
