"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { leadTransitions } from "@/lib/request-schema";
export function RequestStatusActions({
  id,
  status,
  agents = [],
  requester = false,
}: {
  requester?: boolean;
  id: string;
  status: string;
  agents?: { id: string; full_name: string }[];
}) {
  const router = useRouter();
  const [agent, setAgent] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div>
      {agents.length > 0 && (
        <label>
          Matched advertiser
          <select
            className="border rounded p-3"
            value={agent}
            onChange={(e) => setAgent(e.target.value)}
          >
            <option value="">Keep current assignment</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name}
              </option>
            ))}
          </select>
        </label>
      )}
      <label>
        Update request
        <select
          disabled={busy}
          value=""
          className="border rounded p-3 m-2"
          onChange={async (e) => {
            if (!e.target.value) return;
            setBusy(true);
            const r = await fetch(`/api/housing-requests/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                status: e.target.value,
                assigned_agent_id: agent || undefined,
              }),
            });
            if (r.ok) {
              setError("");
              router.refresh();
            } else setError("Could not update request");
            setBusy(false);
          }}
        >
          <option value="">Choose next status</option>
          {(leadTransitions[status] ?? [])
            .filter((s) => !requester || s === "cancelled")
            .map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
        </select>
      </label>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
