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
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Student Hostels & Rooms in Port Harcourt | HousePlug",
  description:
    "Explore student accommodation near UNIPORT and RSU. Compare rooms, rental details and fees, then contact property agents to arrange an inspection.",
  alternates: { canonical: siteUrl() },
  openGraph: {
    title: "Student Hostels & Rooms in Port Harcourt | HousePlug",
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
  "inline-flex min-h-12 items-center justify-center rounded-xl bg-[#1B4332] text-white font-bold px-6 py-3";
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
    for (const [id, n] of campusCounts) counts[id] = n;
  } catch {}
  return (
    <div className="bg-[#F5F8F6] text-gray-900">
      <Header />
      <main className="pt-16">
        <section className="bg-[#1B4332] text-white">
          <div className="mx-auto max-w-7xl grid gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 md:py-20 lg:px-12">
            <div className="space-y-5">
              <p className="text-xs font-bold tracking-widest text-amber-200">
                STUDENT ACCOMMODATION IN PORT HARCOURT
              </p>
              <h1 className="text-3xl leading-tight font-black sm:text-5xl">
                Find a Room Near Campus Without the Stress.
              </h1>
              <p className="text-base text-emerald-50">
                Explore student accommodation near UNIPORT and other Rivers
                State campuses. Compare room details, understand the costs and
                contact agents to arrange inspections.
              </p>
              <Link
                className="hidden md:inline-flex min-h-12 items-center text-white underline font-semibold"
                href="/housing-assistance"
              >
                Help Me Find a Room →
              </Link>
              <div className="relative hidden md:block h-44 overflow-hidden rounded-2xl">
                <Image
                  src="/hero-student-housing.jpg"
                  alt="Student accommodation"
                  fill
                  sizes="50vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
            <div>
              <HeroSearch />
              <Link
                href="/housing-assistance"
                className="inline-flex md:hidden items-center min-h-12 underline py-3"
              >
                Help Me Find a Room →
              </Link>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-12">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold">
              Explore Available Student Rooms
            </h2>
            <Link href="/browse" className="underline py-3">
              Browse rooms
            </Link>
          </div>
          {rooms.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((l, i) => (
                <ListingCard key={l.id} listing={publicListing(l)} index={i} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border bg-white p-6">
              <p>
                We’re checking current rooms and their costs before featuring
                them here.
              </p>
              <Link href="/housing-assistance" className="underline block py-3">
                Request Housing Assistance
              </Link>
            </div>
          )}
        </section>
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-12">
            <h2 className="text-2xl font-bold mb-6">How it works</h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {[
                ["Search", "Filter by campus, location, room type and budget."],
                [
                  "Compare",
                  "Review photos, fees, amenities and availability details.",
                ],
                [
                  "Connect",
                  "Discuss availability and arrange an inspection directly with the landlord or agent.",
                ],
              ].map(([t, d], i) => (
                <article key={t} className="rounded-2xl bg-[#F5F8F6] p-6">
                  <p className="text-emerald-800 font-bold mb-3">0{i + 1}</p>
                  <h3 className="font-bold text-xl">{t}</h3>
                  <p className="mt-2">{d}</p>
                </article>
              ))}
            </div>
            <p className="mt-6">
              Inspect the property and confirm the terms before making payments.
            </p>
          </div>
        </section>
        <section className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-12">
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-6 sm:p-10">
            <h2 className="text-2xl font-bold">
              Can't Find a Room That Fits Your Budget?
            </h2>
            <p className="my-4">
              Tell us your campus, preferred area, total move-in budget and
              move-in date. We'll help check suitable options.
            </p>
            <Link className={button} href="/housing-assistance">
              Request Housing Assistance
            </Link>
          </div>
        </section>
        <section className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-12">
          <h2 className="text-2xl font-bold mb-5">
            Make Better-Informed Housing Decisions
          </h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              [
                "Understand the Fees",
                "Compare rent and the initial payment. Unknown charges stay unconfirmed.",
              ],
              [
                "Know What Was Checked",
                "Identity, authority and property inspection are separate checks.",
              ],
              [
                "Inspect Before Paying",
                "Arrange an inspection directly and independently confirm the terms.",
              ],
            ].map(([t, d]) => (
              <article className="rounded-2xl border bg-white p-5" key={t}>
                <h3 className="font-bold">{t}</h3>
                <p className="mt-2">{d}</p>
              </article>
            ))}
          </div>
          <Link href="/safety" className="underline inline-block py-4">
            Read the Safety Guide
          </Link>
        </section>
        <section className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-12">
          <h2 className="text-2xl font-bold mb-5">Start With Your Campus</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {UNIVERSITIES.map((u) => (
              <article className="rounded-2xl border bg-white p-5" key={u.id}>
                <h3 className="font-bold">{u.shortName}</h3>
                {counts[u.id] ? (
                  <>
                    <p>{counts[u.id]} confirmed, eligible rooms</p>
                    <Link
                      className="underline inline-block py-3"
                      href={`/student-housing/${u.id}`}
                    >
                      Explore campus housing
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-sm mt-2">
                      No confirmed rooms available here right now. Tell us what
                      you need and we’ll help you check.
                    </p>
                    <Link
                      className="underline inline-block py-3"
                      href={`/housing-assistance?university=${u.id}`}
                    >
                      Request Housing Assistance
                    </Link>
                  </>
                )}
              </article>
            ))}
          </div>
        </section>
        <section className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-12">
          <div className="rounded-2xl bg-[#1B4332] text-white p-6 sm:p-10">
            <h2 className="text-2xl font-bold">
              Need a Roommate to Share Accommodation Costs?
            </h2>
            <p className="my-4">
              Explore compatible students and discuss shared housing where the
              property permits it.
            </p>
            <Link href="/roommates" className="underline inline-block py-3">
              Find a Roommate
            </Link>
          </div>
        </section>
        <section className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-12">
          <h2 className="text-2xl font-bold">Housing guides</h2>
          <div className="flex flex-wrap gap-5 mt-4">
            <Link
              href="/guides/student-rental-fees-nigeria"
              className="underline py-3"
            >
              Rental fees explained
            </Link>
            <Link
              href="/guides/uniport-accommodation"
              className="underline py-3"
            >
              UNIPORT accommodation checklist
            </Link>
          </div>
        </section>
        <section className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-12">
          <h2 className="text-2xl font-bold">
            Have Student Accommodation to Rent?
          </h2>
          <p className="my-4">
            Reach students searching near campus with complete property
            information.
          </p>
          <Link href="/signup" className={button}>
            List Your Property
          </Link>
        </section>
        <section className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-12">
          <h2 className="text-2xl font-bold mb-5">
            Frequently asked questions
          </h2>
          {faqs.map((f) => (
            <details key={f.question} className="border-b py-4">
              <summary className="font-semibold cursor-pointer py-2">
                {f.question}
              </summary>
              <p className="py-3 max-w-3xl">{f.answer}</p>
            </details>
          ))}
        </section>
        <FaqJsonLd faqs={faqs} />
      </main>
      <footer className="border-t bg-white px-4 py-8">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-5 items-center">
          <strong>HousePlug</strong>
          {[
            ["/about", "About"],
            ["/safety", "Safety"],
            ["/privacy", "Privacy"],
            ["/terms", "Terms"],
            ["/contact", "Support"],
            ["/roommates", "Roommates"],
          ].map(([p, t]) => (
            <Link key={p} href={p} className="underline py-3">
              {t}
            </Link>
          ))}
          <a
            className="underline py-3"
            href="https://whatsapp.com/channel/0029VbCtrHY7oQhhDU4qIC0I"
          >
            Official WhatsApp channel
          </a>
          <p className="text-sm">
            © {new Date().getFullYear()} HousePlug · Port Harcourt
          </p>
        </div>
      </footer>
    </div>
  );
}
