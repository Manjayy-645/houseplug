import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { LocationPage } from "@/components/seo/location-page";
import { campusName, neighborhoodBySlug, stateBySlug, universityBySlug } from "@/lib/seo-locations";
import { loadNeighborhoodSnapshot } from "@/lib/seo-inventory";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";
type Props = { params: { universitySlug: string; neighborhoodSlug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const university = universityBySlug(params.universitySlug);
  const neighborhood = university && neighborhoodBySlug(university.slug, params.neighborhoodSlug);
  if (!university || !university.editorial.approved || !neighborhood)
    notFound();
  const snapshot = await loadNeighborhoodSnapshot(university.slug, neighborhood.slug);
  return {
    title: `Student Accommodation in ${neighborhood.name} near ${campusName(university.campusId)}`,
    description: `Explore ${neighborhood.name} listings associated with ${campusName(university.campusId)}. Compare each property's disclosed costs and availability.`,
    alternates: { canonical: siteUrl(`/university/${university.slug}/${neighborhood.slug}`) },
    robots: { index: Boolean(snapshot?.indexable), follow: true },
  };
}

export default async function NeighborhoodPage({ params }: Props) {
  const university = universityBySlug(params.universitySlug);
  const neighborhood = university && neighborhoodBySlug(university.slug, params.neighborhoodSlug);
  if (!university || !university.editorial.approved || !neighborhood) notFound();
  if (params.universitySlug !== university.slug || params.neighborhoodSlug !== neighborhood.slug)
    permanentRedirect(`/university/${university.slug}/${neighborhood.slug}`);
  const snapshot = await loadNeighborhoodSnapshot(university.slug, neighborhood.slug);
  if (!snapshot) notFound();
  const state = stateBySlug(university.stateSlug)!;
  return (
    <LocationPage
      title={`Student accommodation in ${neighborhood.name} near ${campusName(university.campusId)}`}
      eyebrow={state.name}
      editorial={neighborhood.editorial}
      listings={snapshot.inventory.listings}
      breadcrumbs={[
        { name: "Home", url: "/" },
        { name: "Nigeria", url: "/student-housing-nigeria" },
        { name: state.name, url: `/student-housing/${state.slug}` },
        { name: campusName(university.campusId), url: `/university/${university.slug}` },
        { name: neighborhood.name, url: `/university/${university.slug}/${neighborhood.slug}` },
      ]}
      related={[{ href: `/university/${university.slug}`, label: `All ${campusName(university.campusId)} rooms` }]}
      guideSlugs={["student-rental-fees-nigeria", ...university.guideSlugs]}
      browseHref={`/browse?university=${university.campusId}&q=${encodeURIComponent(neighborhood.listingArea)}`}
      universityId={university.campusId}
    />
  );
}
