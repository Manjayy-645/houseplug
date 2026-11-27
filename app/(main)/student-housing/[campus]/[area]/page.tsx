import { notFound, permanentRedirect } from "next/navigation";
import { neighborhoodBySlug, universityBySlug } from "@/lib/seo-locations";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return { robots: { index: false, follow: true } };
}

export default function LegacyNeighborhoodPage({
  params,
}: {
  params: { campus: string; area: string };
}) {
  const university = universityBySlug(params.campus);
  const neighborhood = university && neighborhoodBySlug(university.slug, params.area);
  if (!university || !neighborhood) notFound();
  permanentRedirect(`/university/${university.slug}/${neighborhood.slug}`);
}
