import Link from "next/link";
import { ListingCard } from "@/components/listing-card";
import { publicListing } from "@/lib/public-listing";
import { guides } from "@/lib/guides";
import { locationBreadcrumb, type Editorial } from "@/lib/seo-locations";
import type { Listing } from "@/types";

type LocationLink = { href: string; label: string };

export function LocationPage({
  title,
  eyebrow,
  editorial,
  listings,
  breadcrumbs,
  related = [],
  guideSlugs = [],
  browseHref = "/browse",
  universityId,
}: {
  title: string;
  eyebrow: string;
  editorial: Editorial;
  listings: Listing[];
  breadcrumbs: { name: string; url: string }[];
  related?: LocationLink[];
  guideSlugs?: string[];
  browseHref?: string;
  universityId?: string;
}) {
  return (
    <main className="min-h-screen bg-[#F9FAFB] px-4 pb-20 pt-28 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            locationBreadcrumb(breadcrumbs.map(({ name, url }) => ({ name, path: url }))),
          ).replace(/</g, "\\u003c"),
        }}
      />
      <div className="mx-auto max-w-7xl space-y-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.url} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden="true">/</span>}
              {index === breadcrumbs.length - 1 ? (
                <span aria-current="page" className="font-semibold text-[#1B4332]">{crumb.name}</span>
              ) : (
                <Link href={crumb.url} className="underline underline-offset-4">{crumb.name}</Link>
              )}
            </span>
          ))}
        </nav>

        <header className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] p-6 text-white shadow-sm sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-200">{eyebrow}</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-extrabold leading-tight sm:text-5xl">{title}</h1>
          {editorial.intro && <p className="mt-5 max-w-3xl text-base leading-relaxed text-emerald-50 sm:text-lg">{editorial.intro}</p>}
        </header>

        <section aria-labelledby="location-listings" className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="location-listings" className="text-2xl font-bold text-gray-900">Rooms advertised on HousePlug</h2>
              <p className="mt-1 text-sm text-gray-600">These are individual advertiser offers. Availability and mandatory charges may be unconfirmed; check each room&apos;s disclosures before contacting its agent.</p>
            </div>
            <Link href={browseHref} className="inline-flex min-h-11 items-center rounded-xl border border-[#1B4332] px-4 font-semibold text-[#1B4332] hover:bg-emerald-50">
              Browse all rooms
            </Link>
          </div>
          {listings.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={publicListing(listing)} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-700">
              <p>No active rooms are advertised for this location right now. You can browse other areas or tell HousePlug what you need.</p>
              <Link
                href={universityId ? `/housing-assistance?university=${universityId}` : "/housing-assistance"}
                className="mt-3 inline-flex min-h-11 items-center font-semibold text-[#1B4332] underline"
              >
                Request Housing Assistance
              </Link>
            </div>
          )}
        </section>

        {editorial.advice && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
            <h2 className="text-xl font-bold text-gray-900">Before you visit or pay</h2>
            <p className="mt-2 leading-relaxed text-gray-800">{editorial.advice}</p>
            <p className="mt-2 leading-relaxed text-gray-800">Select a property and use “Chat With Agent on WhatsApp” to speak to its responsible advertiser. You and the advertiser arrange any inspection directly.</p>
          </section>
        )}

        {!!editorial.faq?.length && (
          <section className="space-y-4" aria-labelledby="location-faq">
            <h2 id="location-faq" className="text-2xl font-bold text-gray-900">Questions students ask</h2>
            {editorial.faq.map(({ question, answer }) => (
              <div key={question} className="rounded-2xl border border-gray-200 bg-white p-5">
                <h3 className="font-semibold text-gray-900">{question}</h3>
                <p className="mt-2 text-gray-700">{answer}</p>
              </div>
            ))}
          </section>
        )}

        {!!related.length && (
          <nav aria-label="Related locations" className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900">Explore related locations</h2>
            <div className="flex flex-wrap gap-3">
              {related.map(({ href, label }) => (
                <Link key={href} href={href} className="inline-flex min-h-11 items-center rounded-xl border border-gray-200 bg-white px-4 font-semibold text-[#1B4332] hover:border-emerald-400">{label}</Link>
              ))}
            </div>
          </nav>
        )}

        {!!guideSlugs.length && (
          <nav aria-label="Housing guides" className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900">Plan your search</h2>
            <div className="flex flex-wrap gap-3">
              {guideSlugs.filter((slug) => Boolean(guides[slug])).map((slug) => (
                <Link key={slug} href={`/guides/${slug}`} className="inline-flex min-h-11 items-center rounded-xl bg-white px-4 font-semibold text-[#1B4332] shadow-sm underline">{guides[slug].title}</Link>
              ))}
              <Link href="/guides" className="inline-flex min-h-11 items-center px-2 font-semibold text-[#1B4332] underline">All housing guides</Link>
            </div>
          </nav>
        )}
      </div>
    </main>
  );
}
