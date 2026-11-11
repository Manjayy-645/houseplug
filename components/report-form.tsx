"use client";
import { useState } from "react";
export function ReportForm({ listing }: { listing?: string }) {
  const [msg, setMsg] = useState("");
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const r = await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listing_id: listing,
            category: f.get("category"),
            description: f.get("description"),
          }),
        });
        const d = await r.json();
        setMsg(r.ok ? `Report saved: ${d.reference}` : d.error);
      }}
    >
      <label className="block">
        Concern
        <select name="category" className="block border rounded p-3">
          {[
            "pricing",
            "availability",
            "fraud",
            "harassment",
            "images",
            "service",
            "other",
          ].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="block">
        What happened?
        <textarea
          name="description"
          required
          minLength={20}
          maxLength={2000}
          rows={5}
          className="block w-full border rounded p-3"
        />
      </label>
      <p>
        Include relevant facts, not identity documents or financial account
        details.
      </p>
      <button className="rounded-xl bg-[#1B4332] text-white p-3">
        Submit report
      </button>
      <p role="status">{msg}</p>
    </form>
  );
}
