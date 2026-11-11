"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UNIVERSITIES } from "@/lib/constants";
import { HOUSING_SERVICE_CATEGORIES, serviceSubmissionSchema } from "@/lib/service-submission";

export type EditableService = {
  id: string; business_name: string; category: string; university: string;
  description: string; pricing_type: string; price_amount: number | null;
  price_unit: string | null; whatsapp_number: string;
};
const field = "mt-2 block min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-emerald-100";

export function ServiceSubmissionForm({ service }: { service?: EditableService }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return <form className="grid gap-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-8" onSubmit={async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = serviceSubmissionSchema.safeParse({ id: service?.id, business_name: data.get("business_name"), category: data.get("category"), university: data.get("university"), description: data.get("description"), pricing_type: data.get("pricing_type"), price_amount: Number(data.get("price_amount")), price_unit: data.get("price_unit"), whatsapp_number: data.get("whatsapp_number") });
    if (!parsed.success) { setMessage(parsed.error.issues[0].message); return; }
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/services", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const result = await response.json();
      setMessage(response.ok ? "Service submitted for review. Your contact will appear after approval." : result.error || "Could not submit service");
      if (response.ok) router.refresh();
    } catch { setMessage("Could not submit service. Please try again."); }
    finally { setBusy(false); }
  }}>
    <label className="block text-sm font-bold text-gray-800">Service or business name<input name="business_name" defaultValue={service?.business_name} required minLength={2} maxLength={100} className={field} /></label>
    <label className="block text-sm font-bold text-gray-800">Housing service<select name="category" defaultValue={service?.category || ""} required className={field}><option value="" disabled>Select a category</option>{HOUSING_SERVICE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>
    <label className="block text-sm font-bold text-gray-800">Campus served<select name="university" defaultValue={service?.university || ""} required className={field}><option value="" disabled>Select a campus</option>{UNIVERSITIES.map((u) => <option key={u.id} value={u.id}>{u.name} · {u.state}</option>)}</select></label>
    <label className="block text-sm font-bold text-gray-800">WhatsApp contact<input name="whatsapp_number" type="tel" inputMode="tel" autoComplete="tel" defaultValue={service?.whatsapp_number} placeholder="08012345678" required className={field} /><span className="mt-1 block text-xs font-normal text-gray-500">Shown only after approval.</span></label>
    <label className="block text-sm font-bold text-gray-800">Price (₦)<input name="price_amount" type="number" inputMode="numeric" min="1" max="100000000" defaultValue={service?.price_amount ?? ""} required className={field} /></label>
    <label className="block text-sm font-bold text-gray-800">Price type<select name="pricing_type" defaultValue={service?.pricing_type || "starting_from"} className={field}><option value="starting_from">Starting from</option><option value="fixed">Fixed price</option></select></label>
    <label className="block text-sm font-bold text-gray-800">Price covers<input name="price_unit" defaultValue={service?.price_unit || ""} placeholder="per room / per trip / per job" required minLength={2} maxLength={40} className={field} /></label>
    <label className="block text-sm font-bold text-gray-800 sm:col-span-2">Describe the work and any limits<textarea name="description" defaultValue={service?.description} required minLength={30} maxLength={1500} rows={5} className={field} /></label>
    <div className="sm:col-span-2"><button disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#F59E0B] px-6 py-3 text-sm font-extrabold text-[#1B4332] hover:bg-amber-400 disabled:opacity-50 sm:w-auto">{busy ? "Submitting..." : service ? "Submit changes for review" : "List my service for free"}</button><p role="status" className="mt-3 text-sm text-gray-700">{message}</p></div>
  </form>;
}
