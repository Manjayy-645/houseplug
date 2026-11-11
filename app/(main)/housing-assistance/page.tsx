export const dynamic = "force-dynamic";
import Link from "next/link";
import { HousingRequestForm } from "@/components/housing-request-form";
import { featureFlags } from "@/lib/feature-flags";
export const metadata = {
  title: "Request Housing Assistance",
  robots: { index: false, follow: true },
};
export default function Page({
  searchParams,
}: {
  searchParams: { listing?: string; university?: string };
}) {
  return (
    <main className="mx-auto max-w-3xl px-4 pt-28 pb-16 space-y-6">
      <h1 className="text-3xl font-bold">
        Can't Find a Room That Fits Your Budget?
      </h1>
      <p>
        Tell us your campus, preferred area, total move-in budget and move-in
        date. We’ll help check suitable options.
      </p>
      {featureFlags.housingRequests ? (
        <HousingRequestForm
          listingId={searchParams.listing}
          campus={searchParams.university}
        />
      ) : (
        <section className="rounded-xl border p-6">
          <p>
            Request intake is not open yet. You can browse rooms and contact
            advertisers directly.
          </p>
          <Link href="/browse" className="underline block py-4">
            Find Available Rooms
          </Link>
        </section>
      )}
    </main>
  );
}
