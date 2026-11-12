import { publicListing } from "@/lib/public-listing";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UNIVERSITIES } from "@/lib/constants";
import { UniversityLogo } from "@/components/university";
import { inventoryQuery } from "@/lib/public-inventory";
import { ListingCard } from "@/components/listing-card";
import type { Listing } from "@/types";
export const neighbourhoods: Record<string, string> = {
  choba: "Choba",
  alakahia: "Alakahia",
  aluu: "Aluu",
};
export async function CampusHub({
  campus,
  area,
}: {
  campus: string;
  area?: string;
}) {
  const u = UNIVERSITIES.find((x) => x.id === campus);
  if (!u || (area && !(campus === "uniport" && neighbourhoods[area])))
    notFound();
  let q = inventoryQuery()
    .eq("university", campus)
    .order("last_confirmed_at", { ascending: false })
    .limit(24);
  if (area) q = q.ilike("area", neighbourhoods[area]);
  const { data } = await q;
  const rooms = (data ?? []) as Listing[];
  return (
    <main className="max-w-7xl mx-auto px-4 pt-28 pb-16 space-y-6">
      <nav>
        <Link className="underline" href="/">
          Home
        </Link>{" "}
        /{" "}
        <Link className="underline" href={`/student-housing/${campus}`}>
          {u.shortName}
        </Link>
        {area ? ` / ${neighbourhoods[area]}` : ""}
      </nav>
      <div className="flex items-start sm:items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white p-2 shadow-sm border border-gray-100">
          <UniversityLogo university={u} size={44} />
        </div>
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">
            Student accommodation{" "}
            {area ? `in ${neighbourhoods[area]}` : `near ${u.shortName}`}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-0.5">{u.name} · {u.state}</p>
        </div>
      </div>
      <p>
        Compare room details and listed costs. Confirm availability and the full
        move-in total with the agent.
        Check the route to your campus gate and arrange any inspection directly
        with the landlord or agent.
      </p>
      {campus === "uniport" && (
        <nav className="flex gap-5 flex-wrap">
          {Object.entries(neighbourhoods).map(([slug, label]) => (
            <Link
              className="underline py-3"
              key={slug}
              href={`/student-housing/uniport/${slug}`}
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
      {rooms.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rooms.map((l) => (
            <ListingCard key={l.id} listing={publicListing(l)} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border bg-white p-6">
          <p>
            No rooms listed here right now. Tell us what you need
            and we’ll help you check.
          </p>
          <Link
            className="underline block py-4"
            href={`/housing-assistance?university=${u.id}`}
          >
            Request Housing Assistance
          </Link>
        </div>
      )}
      <section className="space-y-3">
        <h2 className="text-2xl font-bold">Compare before committing</h2>
        <p>
          A neighbourhood name does not establish a room’s travel time,
          availability or suitability. Confirm the specific route, amenities,
          permitted occupancy, all mandatory fees and renewal terms.
        </p>
        <p>
          Property checks have a specific scope and date. Advertiser identity
          checks do not establish physical inspection of every property.
          Reconfirm availability before travelling.
        </p>
        <Link
          href="/guides/student-rental-fees-nigeria"
          className="underline inline-block py-3"
        >
          Understand rental fees
        </Link>
      </section>
    </main>
  );
}
