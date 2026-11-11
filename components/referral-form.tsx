"use client";
import { useState } from "react";
export function ReferralForm() {
  const [msg, setMsg] = useState("");
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const r = await fetch("/api/referrals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: f.get("code"),
            campaign: f.get("campaign"),
            active: f.get("active") === "on",
          }),
        });
        setMsg(r.ok ? "Referral recorded" : "Could not record referral");
      }}
    >
      <label className="block">
        Referral code
        <input
          name="code"
          pattern="[a-z0-9_-]{3,40}"
          required
          className="block border p-3"
        />
      </label>
      <label className="block">
        Campaign
        <input
          name="campaign"
          pattern="[a-z][a-z0-9_-]{0,79}"
          required
          className="block border p-3"
        />
      </label>
      <label className="flex gap-3">
        <input type="checkbox" name="active" />
        Enable this referral
      </label>
      <p>
        Do not use names, phone numbers or email addresses in referral codes. No
        commission or outcome is promised.
      </p>
      <button className="border rounded p-3">Save referral</button>
      <p role="status">{msg}</p>
    </form>
  );
}
