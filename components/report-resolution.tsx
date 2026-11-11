"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function ReportResolution({ id }: { id: string }) {
  const [msg, setMsg] = useState("");
  const router = useRouter();
  return (
    <form
      className="flex flex-wrap gap-3 mt-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const r = await fetch(`/api/admin/reports/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: f.get("status"),
            resolution: f.get("resolution"),
          }),
        });
        setMsg(r.ok ? "Recorded" : "Could not save resolution");
        router.refresh();
      }}
    >
      <label>
        Outcome
        <select name="status" className="block border p-3">
          <option value="reviewing">Reviewing</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed with explanation</option>
        </select>
      </label>
      <label>
        Reason
        <input
          name="resolution"
          minLength={10}
          maxLength={1000}
          required
          className="block border p-3"
        />
      </label>
      <button className="border rounded p-3">Record resolution</button>
      <p role="status">{msg}</p>
    </form>
  );
}
