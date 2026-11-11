import { guides } from "@/lib/guides";
import { SITE_URL } from "@/lib/site";
import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/server";
import { inventoryQuery } from "@/lib/public-inventory";
import { UNIVERSITIES } from "@/lib/constants";

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
  ].map((path) => ({ url: SITE_URL + path }));
  const knownGuides = new Set(Object.keys(guides));
  for (const slug of knownGuides)
    routes.push({
      url: `${SITE_URL}/guides/${slug}`,
      lastModified: new Date("2026-11-11"),
    });
  try {
    const [{ data: listings }, { data: content }] = await Promise.all([
      inventoryQuery()
        .order("last_confirmed_at", { ascending: false })
        .limit(2000),
      createServiceClient()
        .from("content_pages")
        .select("slug,updated_at")
        .lte("published_at", new Date().toISOString())
        .not("reviewed_at", "is", null),
    ]);
    for (const l of listings ?? [])
      routes.push({
        url: `${SITE_URL}/listing/${l.id}`,
        lastModified: l.updated_at ? new Date(l.updated_at) : undefined,
      });
    for (const c of content ?? [])
      if (!knownGuides.has(c.slug))
        routes.push({
          url: `${SITE_URL}/guides/${c.slug}`,
          lastModified: c.updated_at ? new Date(c.updated_at) : undefined,
        });
    for (const campus of UNIVERSITIES)
      if (listings?.some((l) => l.university === campus.id))
        routes.push({ url: `${SITE_URL}/student-housing/${campus.id}` });
    for (const area of ["choba", "alakahia", "aluu"])
      if (
        listings?.some(
          (l) => l.university === "uniport" && l.area?.toLowerCase() === area,
        )
      )
        routes.push({ url: `${SITE_URL}/student-housing/uniport/${area}` });
  } catch {
    /* Static canonical routes remain available during database outages. */
  }
  return routes;
}
