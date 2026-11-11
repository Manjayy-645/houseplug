"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function HousingMatchForm({ id }: { id: string }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const form = new FormData(e.currentTarget);
        const listing_ids = String(form.get("rooms"))
          .split(/[\s,]+/)
          .filter(Boolean);
        try {
          const r = await fetch(`/api/housing-requests/${id}/matches`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ listing_ids }),
          });
          const data = await r.json();
          setMessage(r.ok ? "Options saved" : data.error);
          if (r.ok) router.refresh();
        } catch {
          setMessage("Could not save options");
        } finally {
          setBusy(false);
        }
      }}
      className="mt-4 space-y-2"
    >
      <label className="block">
        Suggest up to three rooms (listing IDs)
        <input
          name="rooms"
          required
          className="block w-full rounded border p-3"
        />
      </label>
      <p className="text-sm">
        Only current rooms on this campus with confirmed move-in totals within
        budget are accepted.
      </p>
      <button
        disabled={busy}
        className="rounded bg-primary px-4 py-2 text-white"
      >
        Save room options
      </button>
      <p role="status">{message}</p>
    </form>
  );
}
