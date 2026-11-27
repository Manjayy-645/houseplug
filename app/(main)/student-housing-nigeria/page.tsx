import type { Metadata } from "next";
import { LocationPage } from "@/components/seo/location-page";
import { isNationalIndexable, nationalEditorial, campusName } from "@/lib/seo-locations";
import { loadLocationSnapshot } from "@/lib/seo-inventory";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const snapshot = await loadLocationSnapshot();
  return {
    title: "Student Housing in Nigeria",
    description: "Explore student accommodation listings near universities supported by HousePlug. Compare disclosed costs and contact each property's agent directly.",
    alternates: { canonical: siteUrl("/student-housing-nigeria") },
    robots: { index: isNationalIndexable(snapshot.qualifyingStates.length), follow: true },
  };
}

export default async function NationalHousingPage() {
  const snapshot = await loadLocationSnapshot();
  const listings = snapshot.availableUniversities.flatMap(({ inventory }) => inventory.listings).slice(0, 12);
  const related = snapshot.qualifyingStates.length
    ? snapshot.qualifyingStates.map((state) => ({
        href: `/student-housing/${state.slug}`,
        label: state.name,
      }))
    : snapshot.availableUniversities.map(({ university }) => ({
        href: `/university/${university.slug}`,
        label: campusName(university.campusId),
      }));
  return (
    <LocationPage
      title="Student housing in Nigeria"
      eyebrow="HousePlug campus housing"
      editorial={nationalEditorial}
      listings={listings}
      breadcrumbs={[{ name: "Home", url: "/" }, { name: "Student housing in Nigeria", url: "/student-housing-nigeria" }]}
      related={related}
      guideSlugs={["student-rental-fees-nigeria"]}
    />
  );
}
