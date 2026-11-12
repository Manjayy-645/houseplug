"use client";
import { useState } from "react";
export function RoommateConnectionButton({
  targetUserId,
}: {
  targetUserId: string;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="space-y-3">
      <p>
        Your phone number stays private until you both accept a connection.
        Review the other person’s profile before sharing.
      </p>
      <button
        disabled={busy}
        className="rounded-xl bg-[#1B4332] text-white px-5 py-3"
        onClick={async () => {
          setBusy(true);
          try {
            const r = await fetch("/api/roommate-connections", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "request",
                target_user_id: targetUserId,
              }),
            });
            const d = await r.json();
            setMessage(
              r.ok
                ? "Connection request sent. Manage it in your student dashboard."
                : d.error,
            );
          } catch {
            setMessage("Could not send request");
          } finally {
            setBusy(false);
          }
        }}
      >
        Request a private connection
      </button>
      <p role="status">{message}</p>
      <a className="underline inline-block py-3" href="/student/connections">
        Manage connections
      </a>
    </div>
  );
}
