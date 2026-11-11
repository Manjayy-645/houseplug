"use client";
import { useState } from "react";
export function SupplierVetting({ id, name }: { id: string; name: string }) {
  const [msg, setMsg] = useState("");
  return (
    <form
      className="border rounded-xl bg-white p-5 space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const r = await fetch(`/api/admin/suppliers/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            evidence_reference: f.get("evidence"),
            approved: f.get("approved") === "on",
            days: Number(f.get("days")),
            safety_requirements: f.get("safety"),
            service_hours: f.get("hours"),
          }),
        });
        const d = await r.json();
        setMsg(r.ok ? "Review recorded" : d.error);
      }}
    >
      <h2 className="text-xl font-bold">{name}</h2>
      <label className="block">
        Private evidence reference
        <input
          name="evidence"
          required
          minLength={3}
          maxLength={500}
          className="block border p-3 w-full"
        />
      </label>
      <label className="block">
        Service hours
        <input name="hours" required className="block border p-3 w-full" />
      </label>
      <label className="block">
        Category-specific safety and licence requirements checked
        <textarea
          name="safety"
          minLength={20}
          required
          className="block border p-3 w-full"
        />
      </label>
      <label className="block">
        Valid for days
        <input
          name="days"
          type="number"
          min={1}
          max={365}
          defaultValue={90}
          required
          className="block border p-3"
        />
      </label>
      <label className="flex gap-3">
        <input name="approved" type="checkbox" />
        The provider passed the documented identity, business and
        category-specific review
      </label>
      <button className="border rounded p-3">Record provider review</button>
      <p role="status">{msg}</p>
    </form>
  );
}
