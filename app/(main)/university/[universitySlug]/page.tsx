import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { LocationPage } from "@/components/seo/location-page";
import {
  campusName,
  isNeighborhoodIndexable,
  isUniversityIndexable,
  neighborhoods,
  stateBySlug,
  universityBySlug,
} from "@/lib/seo-locations";
import { loadLocationListings } from "@/lib/seo-inventory";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";
type Props = { params: { universitySlug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const university = universityBySlug(params.universitySlug);
  if (!university || !university.editorial.approved)
    notFound();
  const inventory = await loadLocationListings(university, undefined, 1);
  const name = campusName(university.campusId);
  return {
    title: `Student Accommodation near ${name}`,
    description: `Compare student housing listings associated with ${name}. Review each room's listed rent, mandatory fees and availability, then contact the agent directly.`,
    alternates: { canonical: siteUrl(`/university/${university.slug}`) },
    robots: { index: !inventory.error && isUniversityIndexable(university, inventory.confirmedCount), follow: true },
  };
}

export default async function UniversityPage({ params }: Props) {
  const university = universityBySlug(params.universitySlug);
  if (!university || !university.editorial.approved) notFound();
  if (params.universitySlug !== university.slug)
    permanentRedirect(`/university/${university.slug}`);
  const inventory = await loadLocationListings(university);
  const state = stateBySlug(university.stateSlug)!;
  const parentIndexable = !inventory.error && isUniversityIndexable(university, inventory.confirmedCount);
  const linkedNeighborhoods = await Promise.all(
    neighborhoods
      .filter((n) => n.universitySlug === university.slug && n.editorial.approved)
      .map(async (neighborhood) => ({
        neighborhood,
        inventory: await loadLocationListings(university, neighborhood, 1),
      })),
  );
  return (
    <LocationPage
      title={`Student accommodation near ${campusName(university.campusId)}`}
      eyebrow={state.name}
      editorial={university.editorial}
      listings={inventory.listings}
      breadcrumbs={[
        { name: "Home", url: "/" },
        { name: "Nigeria", url: "/student-housing-nigeria" },
        { name: state.name, url: `/student-housing/${state.slug}` },
        { name: campusName(university.campusId), url: `/university/${university.slug}` },
      ]}
      related={linkedNeighborhoods
        .filter(({ neighborhood, inventory }) =>
          !inventory.error && isNeighborhoodIndexable(neighborhood, inventory.confirmedCount, parentIndexable),
        )
        .map(({ neighborhood }) => ({
          href: `/university/${university.slug}/${neighborhood.slug}`,
          label: neighborhood.name,
        }))}
      guideSlugs={["student-rental-fees-nigeria", ...university.guideSlugs]}
      browseHref={`/browse?university=${university.campusId}`}
      universityId={university.campusId}
    />
  );
}
