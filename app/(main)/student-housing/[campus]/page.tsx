import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { CampusHub } from "@/components/campus-hub";
import { LocationPage } from "@/components/seo/location-page";
import { campusName, isStateIndexable, stateBySlug, universityBySlug } from "@/lib/seo-locations";
import { loadLocationSnapshot } from "@/lib/seo-inventory";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";
type Props = { params: { campus: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const state = stateBySlug(params.campus);
  if (state) {
    if (!state.editorial.approved) notFound();
    const snapshot = await loadLocationSnapshot();
    const qualifying = snapshot.qualifyingUniversities.filter(
      ({ university }) => university.stateSlug === state.slug,
    );
    return {
      title: `Student Housing in ${state.name}`,
      description: `Browse HousePlug student accommodation listings associated with universities in ${state.name}. Check each property's rent, fees and availability.`,
      alternates: { canonical: siteUrl(`/student-housing/${state.slug}`) },
      robots: { index: isStateIndexable(state, qualifying.length), follow: true },
    };
  }
  const university = universityBySlug(params.campus);
  if (!university) notFound();
  return {
    title: `Student accommodation near ${campusName(university.campusId)}`,
    alternates: { canonical: siteUrl(university.editorial.approved ? `/university/${university.slug}` : `/student-housing/${params.campus}`) },
    robots: { index: false, follow: true },
  };
}

export default async function StateOrLegacyCampusPage({ params }: Props) {
  const state = stateBySlug(params.campus);
  if (state) {
    if (!state.editorial.approved) notFound();
    const snapshot = await loadLocationSnapshot();
    const campuses = snapshot.availableUniversities.filter(
      ({ university }) => university.stateSlug === state.slug,
    );
    return (
      <LocationPage
        title={`Student housing in ${state.name}`}
        eyebrow="Explore by university"
        editorial={state.editorial}
        listings={campuses.flatMap(({ inventory }) => inventory.listings).slice(0, 12)}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Nigeria", url: "/student-housing-nigeria" },
          { name: state.name, url: `/student-housing/${state.slug}` },
        ]}
        related={campuses.map(({ university }) => ({
          href: `/university/${university.slug}`,
          label: campusName(university.campusId),
        }))}
        guideSlugs={["student-rental-fees-nigeria"]}
      />
    );
  }
  const university = universityBySlug(params.campus);
  if (!university) notFound();
  if (university.editorial.approved)
    permanentRedirect(`/university/${university.slug}`);
  return <CampusHub campus={university.campusId} />;
}
