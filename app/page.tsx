import type { Listing } from "@/types";
import { publicListing } from "@/lib/public-listing";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Header } from "@/components/header";
import { HeroSearch } from "@/components/hero-search";
import { ListingCard } from "@/components/listing-card";
import { UNIVERSITIES } from "@/lib/constants";
import { inventoryQuery, eligibleCampusCount } from "@/lib/public-inventory";
import { promotionEligible } from "@/lib/housing";
import { siteUrl } from "@/lib/site";
import { FaqJsonLd } from "@/components/seo/json-ld";
import { UniversityLogo } from "@/components/university-logo";
import { SiteFooter } from "@/components/home/site-footer";
import {
  ArrowRight,
  BadgeCheck,
  Search,
  MessageCircle,
  Home as HomeIcon,
  Users,
  Wallet,
  ShieldCheck,
  BookOpen,
  MapPin,
} from "lucide-react";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Student Housing, Roommates & Services in Nigeria | HousePlug",
  description:
    "Browse student rooms near UniPort and RSU, explore other Nigerian campuses, find roommates and housing services. Contact the listing agent directly on WhatsApp.",
  alternates: { canonical: siteUrl() },
  openGraph: {
    title: "Student Housing, Roommates & Services in Nigeria | HousePlug",
    url: siteUrl(),
  },
};
const faqs = [
  {
    question: "Does HousePlug arrange inspections?",
    answer:
      "HousePlug connects students with landlords and agents. You discuss availability, fees and inspection arrangements directly with the advertiser.",
  },
  {
    question: "Does the annual rent include all move-in costs?",
    answer:
      "Not always. Check the itemized charges and initial payment total. An unconfirmed total means some mandatory costs still need checking.",
  },
  {
    question: "What does a checked badge mean?",
    answer:
      "Each check has a specific scope. Advertiser identity checks do not mean every property has been physically inspected. Read the checks on each listing.",
  },
];
const button =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-hp-amber px-7 py-3.5 text-sm font-extrabold text-primary shadow-lg shadow-amber-500/15 transition hover:bg-amber-400 active:scale-[0.98] sm:text-base";
export default async function Home() {
  let rooms: Listing[] = [];
  const counts: Record<string, number> = {};
  try {
    const [{ data }, campusCounts] = await Promise.all([
      inventoryQuery()
        .eq("fees_complete", true)
        .not("total_initial_payment", "is", null)
        .not("media_confirmed_at", "is", null)
        .not("authority_checked_at", "is", null)
        .gt("evidence_expires_at", new Date().toISOString())
        .order("last_confirmed_at", { ascending: false })
        .limit(6),
      Promise.all(
        UNIVERSITIES.map(
          async (u) => [u.id, await eligibleCampusCount(u.id)] as const,
        ),
      ),
    ]);
    rooms = ((data ?? []) as Listing[]).filter((l) => promotionEligible(l));
    if (rooms.length === 0) {
      const { data: legacyRows } = await inventoryQuery()
        .eq("legacy_inventory", true)
        .order("created_at", { ascending: false })
        .limit(6);
      rooms = (legacyRows ?? []) as Listing[];
    }
    for (const [id, n] of campusCounts) counts[id] = n;
  } catch {}
  return (
    <div className="flex min-h-screen flex-col bg-background text-on-background">
      <Header />
      <main className="flex-1 pt-16">
        <section
          aria-label="Find student housing"
          className="relative isolate overflow-hidden bg-primary-container text-white"
        >
          <div className="absolute inset-0 -z-20 opacity-40">
            <Image
              src="/hero-student-housing.jpg"
              alt="Campus surroundings"
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          </div>
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-primary via-primary/80 to-primary/20" />
          <div className="mx-auto max-w-7xl px-5 py-10 text-center sm:px-6 sm:py-16 lg:px-12 lg:py-24">
            <p className="mb-4 text-[10px] font-extrabold tracking-[0.2em] text-amber-200 sm:text-xs">
              STUDENT HOUSING NEAR NIGERIAN CAMPUSES
            </p>
            <h1 className="mx-auto mb-5 max-w-4xl text-[2rem] font-black leading-[1.1] tracking-tight drop-shadow-sm sm:text-5xl lg:text-6xl">
              Find a Room <span className="text-hp-amber">Near Campus</span>{" "}
              Without the Stress.
            </h1>
            <p className="mx-auto mb-7 max-w-2xl text-sm leading-relaxed text-white sm:mb-10 sm:text-base lg:text-lg">
              Explore student accommodation near UNIPORT and other Rivers State
              campuses. Compare room details, understand the costs and contact
              listing agents directly on WhatsApp.
            </p>
            <HeroSearch />
            <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
              <Link
                href="/housing-assistance"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-extrabold text-primary shadow-lg transition hover:bg-emerald-50"
              >
                Help Me Find a Room
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link
                href="/browse"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/30 bg-white/10 px-7 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
              >
                View all listings
              </Link>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="trust-heading"
          className="border-b border-gray-100 bg-white px-5 py-9 sm:px-6 sm:py-12"
        >
          <div className="mx-auto max-w-7xl lg:px-8">
            <h2
              id="trust-heading"
              className="text-center text-xl font-black tracking-tight text-primary sm:text-2xl"
            >
              Make Better-Informed Housing Decisions
            </h2>
            <div className="mt-7 grid gap-6 md:grid-cols-3 md:gap-0 md:divide-x md:divide-gray-100">
              {[
                {
                  icon: Wallet,
                  title: "Understand the Fees",
                  text: "Compare rent and the initial payment. Unknown charges stay unconfirmed.",
                  color: "bg-amber-50 text-amber-800",
                },
                {
                  icon: BadgeCheck,
                  title: "Know What Was Checked",
                  text: "Identity, authority and property inspection are separate checks.",
                  color: "bg-emerald-50 text-emerald-800",
                },
                {
                  icon: ShieldCheck,
                  title: "Inspect Before Paying",
                  text: "Arrange an inspection directly and independently confirm the terms.",
                  color: "bg-blue-50 text-blue-700",
                },
              ].map(({ icon: Icon, title, text, color }) => (
                <article key={title} className="flex items-start gap-4 md:px-6">
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${color}`}
                  >
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">
                      {text}
                    </p>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link
                href="/safety"
                className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary underline decoration-emerald-200 underline-offset-4"
              >
                Read the Safety Guide
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="campus-heading"
          className="border-b border-gray-100 bg-gray-50 px-5 py-10 sm:px-6 sm:py-16"
        >
          <div className="mx-auto max-w-7xl lg:px-8">
            <div className="mb-7 text-center">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.2em] text-gray-600">
                Housing for students at
              </p>
              <h2
                id="campus-heading"
                className="text-2xl font-black tracking-tight text-primary sm:text-3xl"
              >
                Start With Your Campus
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
              {UNIVERSITIES.map((u) => (
                <article
                  key={u.id}
                  className="flex flex-col items-center rounded-[1.5rem] border border-gray-100 bg-white p-4 text-center shadow-sm transition-shadow hover:shadow-xl sm:rounded-[2rem] sm:p-6"
                >
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50">
                    <UniversityLogo university={u} size={48} />
                  </div>
                  <h3 className="text-base font-extrabold text-primary">
                    {u.shortName}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-gray-600">
                    {u.name}
                  </p>
                  {counts[u.id] ? (
                    <>
                      <p className="mb-4 mt-4 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                        {counts[u.id]} listed{" "}
                        {counts[u.id] === 1 ? "room" : "rooms"}
                      </p>
                      <Link
                        href={`/student-housing/${u.id}`}
                        className="mt-auto inline-flex min-h-11 items-center justify-center gap-1 text-xs font-bold text-primary underline underline-offset-4"
                      >
                        Explore campus housing
                        <ArrowRight aria-hidden="true" className="h-3 w-3" />
                      </Link>
                    </>
                  ) : (
                    <>
                      <p className="mb-3 mt-4 text-xs leading-relaxed text-gray-600">
                        No rooms listed here right now. Tell us
                        what you need and we’ll help you check.
                      </p>
                      <Link
                        href={`/housing-assistance?university=${u.id}`}
                        className="mt-auto inline-flex min-h-11 items-center justify-center text-xs font-bold text-primary underline underline-offset-4"
                      >
                        Request Housing Assistance
                      </Link>
                    </>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="rooms-heading"
          className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-20 lg:px-12"
        >
          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-800">
                Your next place starts here
              </p>
              <h2
                id="rooms-heading"
                className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl lg:text-4xl"
              >
                Explore Student Rooms
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-600 sm:text-base">
                Compare listed rooms and disclosed costs. Confirm availability
                and all rental terms directly with the agent.
              </p>
            </div>
            <Link
              href="/browse"
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-primary/5 px-6 py-3 text-sm font-bold text-primary transition hover:bg-primary/10"
            >
              Browse rooms
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
          {rooms.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((l, i) => (
                <ListingCard key={l.id} listing={publicListing(l)} index={i} />
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border-2 border-dashed border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
              <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-primary">
                <HomeIcon aria-hidden="true" className="h-8 w-8" />
              </span>
              <h3 className="text-xl font-extrabold text-primary">
                We’re checking the details
              </h3>
              <p className="mx-auto mb-6 mt-3 max-w-lg text-sm leading-relaxed text-gray-600">
                We’re checking current rooms and their costs before featuring
                them here.
              </p>
              <Link href="/housing-assistance" className={button}>
                Request Housing Assistance
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          )}
        </section>

        <section className="border-y border-gray-100 bg-gray-50 px-5 py-12 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-7xl lg:px-8">
            <div className="mb-9 text-center">
              <h2 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
                How it works
              </h2>
              <div className="mx-auto mt-4 h-1.5 w-20 rounded-full bg-hp-amber" />
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              {[
                {
                  icon: Search,
                  title: "Search",
                  text: "Filter by campus, location, room type and budget.",
                  color: "bg-blue-50 text-blue-700",
                },
                {
                  icon: Wallet,
                  title: "Compare",
                  text: "Review photos, fees, amenities and availability details.",
                  color: "bg-amber-50 text-amber-800",
                },
                {
                  icon: MessageCircle,
                  title: "Connect",
                  text: "Discuss availability and arrange an inspection directly with the landlord or agent.",
                  color: "bg-emerald-50 text-emerald-800",
                },
              ].map(({ icon: Icon, title, text, color }, i) => (
                <article
                  key={title}
                  className="rounded-[2rem] border border-gray-100 bg-white p-7 text-center shadow-sm transition-shadow hover:shadow-xl sm:p-8"
                >
                  <span
                    className={`mx-auto mb-5 flex h-16 w-16 rotate-3 items-center justify-center rounded-2xl ${color}`}
                  >
                    <Icon aria-hidden="true" className="h-8 w-8" />
                  </span>
                  <h3 className="text-lg font-black text-gray-900">
                    {i + 1}. {title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-gray-600">
                    {text}
                  </p>
                </article>
              ))}
            </div>
            <p className="mt-7 text-center text-sm font-medium text-gray-600">
              Inspect the property and confirm the terms before making payments.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-16 lg:px-12">
          <div className="flex flex-col items-start justify-between gap-6 rounded-[2rem] border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-7 shadow-sm sm:p-10 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <p className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-900">
                <MapPin aria-hidden="true" className="h-4 w-4" />A little help
                with the search
              </p>
              <h2 className="text-2xl font-black tracking-tight text-primary sm:text-3xl">
                Can&apos;t Find a Room That Fits Your Budget?
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-gray-600 sm:text-base">
                Tell us your campus, preferred area, total move-in budget and
                move-in date. We&apos;ll help check suitable options.
              </p>
            </div>
            <Link href="/housing-assistance" className={`${button} shrink-0`}>
              Request Housing Assistance
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-12 pt-3 sm:px-6 sm:pb-20 lg:px-12">
          <div className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary-container to-emerald-900 p-7 text-white shadow-2xl sm:rounded-[2.5rem] sm:p-12 lg:p-16">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-24 -z-10 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 -left-20 -z-10 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl"
            />
            <div className="flex flex-col items-center justify-between gap-8 text-center md:flex-row md:text-left">
              <div className="max-w-2xl">
                <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-amber-200">
                  <Users aria-hidden="true" className="h-4 w-4" />
                  Roommate matching
                </p>
                <h2 className="text-2xl font-black leading-tight tracking-tight sm:text-3xl lg:text-4xl">
                  Need a Roommate to Share{" "}
                  <span className="text-hp-amber">Accommodation Costs?</span>
                </h2>
                <p className="my-5 text-sm leading-relaxed text-white sm:text-base">
                  Explore compatible students and discuss shared housing where
                  the property permits it.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link href="/roommates" className={button}>
                    <Users aria-hidden="true" className="h-4 w-4" />
                    Find a Roommate
                  </Link>
                  <Link
                    href="/roommates/create"
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 bg-white/10 px-7 py-3 text-sm font-bold text-white transition hover:bg-white/20"
                  >
                    Post a Request
                  </Link>
                </div>
              </div>
              <div
                aria-hidden="true"
                className="relative flex h-36 w-36 shrink-0 items-center justify-center rounded-full bg-amber-400/15 sm:h-44 sm:w-44"
              >
                <span className="absolute inset-4 rounded-full bg-emerald-500/30" />
                <Users className="relative h-20 w-20 text-white sm:h-24 sm:w-24" />
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-gray-100 bg-white px-5 py-12 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-7xl lg:px-8">
            <div className="mb-7">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-800">
                Know before you move
              </p>
              <h2 className="text-2xl font-black tracking-tight text-primary sm:text-3xl">
                Housing guides
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                [
                  "student-rental-fees-nigeria",
                  "Rental fees explained",
                  "Understand rent, deposits and the initial housing payment.",
                ],
                [
                  "uniport-accommodation",
                  "UNIPORT accommodation checklist",
                  "What to ask and check when comparing a room near campus.",
                ],
                [
                  "uniport-hostel-prices",
                  "Compare housing costs",
                  "Compare the full cost of moving in, without guessed price ranges.",
                ],
              ].map(([slug, title, text]) => (
                <Link
                  key={slug}
                  href={`/guides/${slug}`}
                  className="group rounded-2xl border border-gray-100 bg-gray-50 p-6 shadow-sm transition hover:border-emerald-200 hover:shadow-lg"
                >
                  <BookOpen
                    aria-hidden="true"
                    className="mb-4 h-6 w-6 text-emerald-800"
                  />
                  <h3 className="flex items-center justify-between gap-3 text-base font-bold text-primary">
                    {title}
                    <ArrowRight
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1"
                    />
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-gray-600">
                    {text}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-primary-container px-5 py-14 text-center text-white sm:px-6 sm:py-20">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-800/40 via-transparent to-transparent"
          />
          <div className="relative mx-auto max-w-3xl">
            <h2 className="text-2xl font-black tracking-tight sm:text-4xl">
              Have Student Accommodation to Rent?
            </h2>
            <p className="mx-auto my-6 max-w-xl text-sm leading-relaxed text-emerald-50 sm:text-lg">
              Reach students searching near campus with complete property
              information.
            </p>
            <Link href="/signup" className={button}>
              List Your Property
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-5 py-12 sm:px-6 sm:py-20">
          <div className="mb-7 text-center">
            <h2 className="text-2xl font-black tracking-tight text-primary sm:text-3xl">
              Frequently asked questions
            </h2>
            <div className="mx-auto mt-4 h-1.5 w-16 rounded-full bg-hp-amber" />
          </div>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details
                key={f.question}
                className="group rounded-2xl border border-gray-200 bg-white px-5 shadow-sm open:border-emerald-200"
              >
                <summary className="cursor-pointer py-5 text-sm font-bold text-primary sm:text-base">
                  {f.question}
                </summary>
                <p className="pb-5 text-sm leading-relaxed text-gray-600">
                  {f.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
        <FaqJsonLd faqs={faqs} />
      </main>
      <SiteFooter />
    </div>
  );
}
