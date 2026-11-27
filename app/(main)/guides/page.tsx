import type { Metadata } from "next";
import Link from "next/link";
import { guides } from "@/lib/guides";
import { createServiceClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/site";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Student Housing Guides",
  description: "Reviewed HousePlug guides to comparing university accommodation, neighbourhoods, rental fees and safer renting in Nigeria.",
  alternates: { canonical: siteUrl("/guides") },
};

const categories: Record<string, string> = {
  "student-rental-fees-nigeria": "Rental safety and fees",
  "uniport-accommodation": "University accommodation",
  "uniport-hostel-prices": "Accommodation costs",
  "uniport-neighbourhood-comparison": "Neighbourhood comparison",
};

export default async function GuidesPage() {
  const staticGuides = Object.entries(guides).map(([slug, guide]) => ({
    slug,
    title: guide.title,
    description: guide.description,
    category: categories[slug] ?? "Housing guide",
  }));
  let reviewedGuides: typeof staticGuides = [];
  try {
    const { data, error } = await createServiceClient()
      .from("content_pages")
      .select("slug,title,body,university,area")
      .not("reviewed_at", "is", null)
      .lte("published_at", new Date().toISOString())
      .order("updated_at", { ascending: false })
      .limit(100);
    if (!error)
      reviewedGuides = (data ?? [])
        .filter((guide) => !guides[guide.slug])
        .map((guide) => ({
          slug: guide.slug,
          title: guide.title,
          description: guide.body.slice(0, 160),
          category: guide.area
            ? "Neighbourhood comparison"
            : guide.university
              ? "University accommodation"
              : "Rental safety and fees",
        }));
  } catch {
    // The reviewed, code-backed guides remain available during a DB outage.
  }
  const published = [...staticGuides, ...reviewedGuides];
  return (
    <main className="min-h-screen bg-[#F9FAFB] px-4 pb-20 pt-28 sm:px-6">
      <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }, { name: "Housing guides", url: "/guides" }]} />
      <div className="mx-auto max-w-6xl">
        <nav aria-label="Breadcrumb" className="text-sm text-gray-600">
          <Link href="/" className="underline">Home</Link> / Housing guides
        </nav>
        <header className="mt-6 rounded-3xl bg-[#1B4332] p-6 text-white sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-200">HousePlug learning hub</p>
          <h1 className="mt-3 text-3xl font-extrabold sm:text-5xl">Student housing guides</h1>
          <p className="mt-4 max-w-2xl text-emerald-50">Understand costs, compare real rooms and plan safer conversations with landlords and agents. Guides are published after editorial review.</p>
        </header>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {published.map((guide) => (
            <article key={guide.slug} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-[#1B4332]">{guide.category}</p>
              <h2 className="mt-2 text-xl font-bold text-gray-900">
                <Link href={`/guides/${guide.slug}`} className="hover:underline">{guide.title}</Link>
              </h2>
              <p className="mt-3 text-gray-700">{guide.description}</p>
              <Link href={`/guides/${guide.slug}`} className="mt-4 inline-flex min-h-11 items-center font-semibold text-[#1B4332] underline">Read guide</Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
