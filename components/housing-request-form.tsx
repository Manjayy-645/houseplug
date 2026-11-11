"use client";
import { useRef, useState } from "react";
import { UNIVERSITIES, ROOM_TYPES } from "@/lib/constants";
export function HousingRequestForm({
  listingId,
  campus,
}: {
  listingId?: string;
  campus?: string;
}) {
  const key = useRef<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    key.current ??= crypto.randomUUID();
    try {
      const query = new URLSearchParams(location.search);
      const body = {
        submission_key: key.current,
        listing_id: listingId,
        university: f.get("university"),
        area: f.get("area"),
        total_budget: Number(f.get("total_budget")),
        move_in_date: f.get("move_in_date"),
        room_type: f.get("room_type") || undefined,
        contact_name: f.get("contact_name"),
        contact_phone: f.get("contact_phone"),
        contact_email: f.get("contact_email"),
        contact_consent: f.get("contact_consent") === "on",
        marketing_consent: f.get("marketing_consent") === "on",
        website: f.get("website"),
        source: query.get("utm_source") || undefined,
        medium: query.get("utm_medium") || undefined,
        campaign: query.get("utm_campaign") || undefined,
        content_code: query.get("utm_content") || undefined,
        referral_code: query.get("ref") || undefined,
      };
      const r = await fetch("/api/housing-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.error);
      setReference(data.reference);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your request");
    } finally {
      setBusy(false);
    }
  }
  if (reference)
    return (
      <section role="status" className="rounded-2xl bg-emerald-50 p-6">
        <h2 className="text-xl font-bold">Your request is saved</h2>
        <p>
          Reference: <strong>{reference}</strong>
        </p>
        <p>
          HousePlug connects you with advertisers. Discuss availability, fees
          and inspection arrangements directly with the landlord or agent. No
          appointment has been booked.
        </p>
        <a href="/browse" className="underline block py-4">
          Browse available rooms
        </a>
      </section>
    );
  const input =
    "mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-700";
  return (
    <form
      onSubmit={submit}
      className="space-y-5 rounded-2xl border bg-white p-5 sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label>
          Campus
          <select
            aria-label="Campus"
            name="university"
            defaultValue={campus || ""}
            required
            className={input}
          >
            <option value="">Choose your campus</option>
            {UNIVERSITIES.map((u) => (
              <option value={u.id} key={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Preferred area
          <input name="area" required maxLength={120} className={input} />
        </label>
        <label>
          Total move-in budget (₦)
          <input
            type="number"
            name="total_budget"
            min={1}
            max={100000000}
            required
            className={input}
          />
        </label>
        <label>
          Move-in date
          <input
            type="date"
            name="move_in_date"
            min={new Date().toISOString().slice(0, 10)}
            required
            className={input}
          />
        </label>
        <label>
          Room type
          <select name="room_type" className={input}>
            <option value="">Any room type</option>
            {ROOM_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Your name
          <input
            name="contact_name"
            required
            maxLength={80}
            autoComplete="name"
            className={input}
          />
        </label>
        <label>
          Phone or WhatsApp number
          <input
            name="contact_phone"
            type="tel"
            autoComplete="tel"
            required
            className={input}
          />
        </label>
        <label>
          Email (optional)
          <input
            type="email"
            name="contact_email"
            autoComplete="email"
            className={input}
          />
        </label>
      </div>
      <label className="hidden" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <label className="flex gap-3 items-start">
        <input
          type="checkbox"
          name="contact_consent"
          required
          className="mt-1 h-5 w-5 shrink-0"
        />
        <span>
          I agree to HousePlug using my contact details for this request and
          sharing them with matched landlords or agents for follow-up.{" "}
          <a className="underline" href="/privacy">
            Privacy policy
          </a>
          .
        </span>
      </label>
      <label className="flex gap-3 items-start">
        <input
          type="checkbox"
          name="marketing_consent"
          className="mt-1 h-5 w-5 shrink-0"
        />
        <span>
          Send me optional housing updates. This is separate from follow-up
          about my request.
        </span>
      </label>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <button
        disabled={busy}
        className="min-h-12 rounded-xl bg-[#1B4332] text-white font-bold px-6 py-3 disabled:opacity-50"
      >
        {busy ? "Saving…" : "Submit Housing Request"}
      </button>
      <p className="text-sm text-gray-600">
        Submitting is free. HousePlug does not collect rent or arrange
        inspections on your behalf. Response times and availability must be
        confirmed directly.
      </p>
    </form>
  );
}
