import Link from "next/link";
import type { Listing } from "@/types";
import {
  moveInTotal,
  sharingEligible,
  verificationLabels,
} from "@/lib/housing";
import { formatNaira } from "@/lib/utils";
export function ListingTruthPanel({ listing }: { listing: Listing }) {
  const total = moveInTotal(listing);
  return (
    <section
      className="rounded-2xl border bg-white p-5 my-4 space-y-3"
      aria-label="Costs and property checks"
    >
      <h2 className="text-xl font-bold">Know the costs before you inspect</h2>
      <p>
        Annual rent: <strong>{formatNaira(listing.price_yearly)}</strong>
      </p>
      {(listing.fee_items ?? []).map((f, i) => (
        <p key={i}>
          {f.label}:{" "}
          {f.amount === null ? "not confirmed" : formatNaira(f.amount)} ·{" "}
          {f.refundable ? "refundable" : "non-refundable"} ·{" "}
          {f.mandatory ? "mandatory" : "optional"}
          {f.recipient
            ? ` · paid to ${f.recipient}`
            : " · recipient not confirmed"}
        </p>
      ))}
      <p className="font-bold">
        Initial housing payment:{" "}
        {total === null ? "total not yet confirmed" : formatNaira(total)}
      </p>
      <p>
        Annual renewal rent:{" "}
        {listing.renewal_amount == null
          ? "not yet confirmed"
          : formatNaira(listing.renewal_amount)}
      </p>
      <p>
        Fees last reviewed:{" "}
        {listing.last_fee_verified_at
          ? new Date(listing.last_fee_verified_at).toLocaleDateString("en-NG")
          : "not yet confirmed"}
      </p>
      <p className="text-sm">
        Optional inspection charges are separate. Confirm all fees and refund
        terms directly before paying.
      </p>
      <p>
        {sharingEligible(listing)
          ? `Shared occupancy permitted for up to ${listing.occupancy} people.`
          : "Shared occupancy permission not confirmed. No rent split is recommended."}
      </p>
      <p>
        Availability:{" "}
        {listing.last_confirmed_at
          ? `last checked ${new Date(listing.last_confirmed_at).toLocaleDateString("en-NG")}`
          : "not yet confirmed"}
      </p>
      <p>
        Property checks:{" "}
        {verificationLabels(listing).join("; ") ||
          "no current property checks recorded"}
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          className="underline py-3"
          href={`/housing-assistance?listing=${listing.id}`}
        >
          Ask About This Room
        </Link>
        <Link className="underline py-3" href={`/report?listing=${listing.id}`}>
          Report this listing
        </Link>
        <Link className="underline py-3" href="/safety">
          Safety Guide
        </Link>
      </div>
    </section>
  );
}
