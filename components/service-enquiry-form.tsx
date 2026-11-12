"use client";
import { useState } from "react";
export function ServiceEnquiryForm({ providerId }: { providerId: string }) {
  const [msg, setMsg] = useState("");
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const r = await fetch("/api/service-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider_id: providerId,
            description: f.get("description"),
            contact_consent: f.get("contact_consent") === "on",
          }),
        });
        const d = await r.json();
        setMsg(
          r.ok
            ? `Enquiry saved: ${d.reference}. This is not a booking; agree details directly with the provider.`
            : d.error,
        );
      }}
    >
      <label className="block">
        What do you need?
        <textarea
          name="description"
          rows={4}
          minLength={20}
          maxLength={1000}
          required
          className="block w-full border rounded p-3"
        />
      </label>
      <label className="flex gap-3">
        <input type="checkbox" name="contact_consent" required />I agree to
        share my registered contact details with this provider for follow-up
        about this service enquiry.
      </label>
      <button className="rounded-xl bg-[#1B4332] text-white p-3">
        Request a quote
      </button>
      <p role="status">{msg}</p>
    </form>
  );
}
