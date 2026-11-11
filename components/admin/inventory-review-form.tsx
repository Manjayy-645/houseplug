"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FeeEditor, initialFees } from "@/components/fee-editor";
import type { Listing } from "@/types";
export function InventoryReviewForm({ listing }: { listing: Listing }) {
  const router = useRouter();
  const [fees, setFees] = useState(
    listing.fee_items?.length ? listing.fee_items : initialFees,
  );
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="rounded-xl border bg-white p-6 space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const f = new FormData(e.currentTarget);
        const payload = {
          fee_items: fees,
          fees_complete: f.get("fees_complete") === "on",
          fee_source: f.get("fee_source"),
          renewal_amount:
            f.get("renewal_amount") === ""
              ? null
              : Number(f.get("renewal_amount")),
          sharing_allowed: f.get("sharing_allowed") === "on",
          occupancy: Number(f.get("occupancy")),
          confirm_availability: f.get("confirm_availability") === "on",
          confirm_media: f.get("confirm_media") === "on",
          availability_days: Number(f.get("availability_days")),
          evidence_days: 90,
          authority_checked: f.get("authority_checked") === "on",
          physically_inspected: f.get("physically_inspected") === "on",
          evidence_pointer: f.get("evidence_pointer"),
        };
        const r = await fetch(`/api/admin/inventory/${listing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await r.json();
        setResult(r.ok ? "Review recorded" : data.error);
        setBusy(false);
        if (r.ok) router.refresh();
      }}
    >
      <h2 className="font-bold text-xl">{listing.title}</h2>
      <p>
        Review scope is specific to this property. Do not infer physical
        inspection from advertiser identity.
      </p>
      <FeeEditor value={fees} onChange={setFees} />
      <label className="block">
        Fee source and reconciliation notes
        <input
          name="fee_source"
          required
          minLength={3}
          maxLength={500}
          className="block border rounded p-3 w-full"
        />
      </label>
      <label className="flex gap-2">
        <input name="fees_complete" type="checkbox" />
        All mandatory initial charges have been reconciled
      </label>
      <label className="block">
        Renewal rent (₦; leave blank if unknown)
        <input
          type="number"
          name="renewal_amount"
          min={0}
          className="block border rounded p-3"
        />
      </label>
      <label className="flex gap-2">
        <input
          name="sharing_allowed"
          type="checkbox"
          defaultChecked={listing.sharing_allowed}
        />
        Owner explicitly permits shared occupancy
      </label>
      <label className="block">
        Maximum permitted occupants
        <input
          name="occupancy"
          type="number"
          min={1}
          max={4}
          defaultValue={listing.occupancy ?? 1}
          required
          className="block border rounded p-3"
        />
      </label>
      {[
        ["confirm_availability", "Advertiser has reconfirmed availability"],
        ["confirm_media", "Property images have been checked"],
        ["authority_checked", "Authority to list this property checked"],
        [
          "physically_inspected",
          "This property was physically inspected (requires actual evidence)",
        ],
      ].map(([n, t]) => (
        <label key={n} className="flex gap-2">
          <input name={n} type="checkbox" />
          {t}
        </label>
      ))}
      <label className="block">
        Reconfirm after (days)
        <input
          name="availability_days"
          type="number"
          min={1}
          max={30}
          defaultValue={14}
          required
          className="block border rounded p-3"
        />
      </label>
      <label className="block">
        Private evidence reference
        <input
          name="evidence_pointer"
          required
          minLength={3}
          maxLength={500}
          className="block border rounded p-3 w-full"
        />
      </label>
      <button
        disabled={busy}
        className="rounded-xl bg-[#1B4332] text-white p-3 font-bold"
      >
        {busy ? "Recording…" : "Record property review"}
      </button>
      <p role="status">{result}</p>
    </form>
  );
}
