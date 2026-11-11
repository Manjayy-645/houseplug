import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { featureFlags } from "@/lib/feature-flags";
import { siteUrl } from "@/lib/site";
import { UNIVERSITIES } from "@/lib/constants";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Campus service providers",
  alternates: { canonical: siteUrl("/services") },
};
export default async function Page({
  searchParams,
}: {
  searchParams: { category?: string; university?: string };
}) {
  let services: any[] = [];
  if (featureFlags.services) {
    const { data } = await createServiceClient()
      .from("service_providers")
      .select(
        "id,business_name,category,university,description,price_amount,pricing_type,price_unit,vetting_expires_at,listing_expires_at",
      )
      .eq("status", "active")
      .not("vetted_at", "is", null)
      .gt("vetting_expires_at", new Date().toISOString());
    const counts: Record<string, number> = {};
    for (const s of data ?? [])
      counts[s.category] = (counts[s.category] ?? 0) + 1;
    services = (data ?? []).filter(
      (s) =>
        counts[s.category] >= 3 &&
        (!s.listing_expires_at ||
          Date.parse(s.listing_expires_at) > Date.now()),
    );
  }
  const categories = [...new Set(services.map((s) => s.category))];
  services = services.filter(
    (s) =>
      (!searchParams.category || s.category === searchParams.category) &&
      (!searchParams.university || s.university === searchParams.university),
  );
  return (
    <main className="max-w-6xl mx-auto px-4 pt-28 pb-16 space-y-6">
      <h1 className="text-3xl font-bold">Campus services</h1>
      <p>
        Connect directly with independent providers. Confirm the quote, scope,
        availability and safety requirements before agreeing to work. HousePlug
        is not the service contractor.
      </p>
      <form className="flex flex-wrap gap-4">
        <label>
          Service
          <select
            className="block border rounded p-3"
            name="category"
            defaultValue={searchParams.category}
          >
            <option value="">All available categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Campus
          <select
            name="university"
            defaultValue={searchParams.university}
            className="block border rounded p-3"
          >
            <option value="">All campuses</option>
            {UNIVERSITIES.map((u) => (
              <option key={u.id} value={u.id}>
                {u.shortName}
              </option>
            ))}
          </select>
        </label>
        <button className="rounded-xl bg-[#1B4332] text-white p-3 self-end">
          Find providers
        </button>
      </form>
      {services.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <article
              className="border rounded-xl bg-white p-5 space-y-3"
              key={s.id}
            >
              <h2 className="text-xl font-bold">{s.business_name}</h2>
              <p>
                {s.category} · {s.university}
              </p>
              <p>{s.description}</p>
              <p>
                {s.price_amount == null
                  ? "Request a quote"
                  : `${s.pricing_type === "starting_from" ? "From " : ""}₦${s.price_amount.toLocaleString("en-NG")} ${s.price_unit || ""}`}
              </p>
              <Link
                href={`/services/${s.id}`}
                className="underline inline-block py-3"
              >
                View service details
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <section className="rounded-xl border p-6 bg-white">
          <h2 className="font-bold text-xl">
            Provider discovery is being reviewed
          </h2>
          <p>
            Categories open after there is enough vetted supply and complaint
            support.
          </p>
          <Link href="/report" className="underline inline-block py-3">
            Suggest a service
          </Link>
        </section>
      )}
      <Link className="underline block py-3" href="/services/manage">
        Manage your existing service
      </Link>
    </main>
  );
}
