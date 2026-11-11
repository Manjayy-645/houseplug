"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function ConnectionActions({
  target,
  status,
  incoming,
}: {
  target: string;
  status: string;
  incoming: boolean;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  return (
    <div className="flex flex-wrap gap-3 items-center">
      {(status === "accepted"
        ? ["contact", "revoke", "block"]
        : status === "pending"
          ? incoming
            ? ["accept", "decline", "block"]
            : ["revoke", "block"]
          : ["block"]
      ).map((action) => (
        <button
          className="border rounded-lg p-3"
          key={action}
          onClick={async () => {
            const r = await fetch("/api/roommate-connections", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action, target_user_id: target }),
            });
            const d = await r.json();
            setMsg(
              r.ok
                ? d.contact
                  ? `Shared contact: ${d.contact}`
                  : "Updated"
                : d.error,
            );
            router.refresh();
          }}
        >
          {action === "contact" ? "Show accepted contact" : action}
        </button>
      ))}
      <p role="status">{msg}</p>
    </div>
  );
}
