import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock3, MapPin, ShieldCheck, Wrench } from "lucide-react";
import { featureFlags } from "@/lib/feature-flags";
import { createServiceClient } from "@/lib/supabase/server";
import { ServiceEnquiryForm } from "@/components/service-enquiry-form";
import { ServiceWhatsAppLink } from "@/components/services/service-whatsapp-link";
import { formatServicePrice, getCategoryLabel } from "@/lib/service-utils";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Independent campus service provider",
  robots: { index: false, follow: true },
};
export default async function Page({ params }: { params: { id: string } }) {
  if (!featureFlags.services) notFound();
  const { data: s } = await createServiceClient()
    .from("service_providers")
    .select(
      "id,business_name,description,category,university,service_hours,safety_requirements,pricing_type,price_amount,price_unit,whatsapp_number,listing_expires_at",
    )
    .eq("id", params.id)
    .eq("status", "active")
    .not("vetted_at", "is", null)
    .gt("vetting_expires_at", new Date().toISOString())
    .single();
  if (
    !s ||
    (s.listing_expires_at && Date.parse(s.listing_expires_at) < Date.now())
  )
    notFound();
  return (
    <main className="min-h-screen bg-[#F9FAFB] pb-20">
      <section className="bg-[#1B4332] px-4 pb-20 pt-28 text-white sm:pt-32">
        <div className="mx-auto max-w-5xl">
          <Link href="/services" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-emerald-100 hover:text-white"><ArrowLeft className="h-4 w-4" /> Campus services</Link>
          <p className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-amber-200"><Wrench className="h-3.5 w-3.5" /> {getCategoryLabel(s.category)}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">{s.business_name}</h1>
          <p className="mt-4 flex items-center gap-2 text-sm text-emerald-100"><MapPin className="h-4 w-4" /> {s.university}</p>
        </div>
      </section>
      <div className="mx-auto -mt-10 grid max-w-5xl gap-5 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8">
        <article className="rounded-3xl border border-gray-100 bg-white p-5 shadow-lg shadow-[#1B4332]/5 sm:p-8">
          <h2 className="text-xl font-black text-gray-900">About this service</h2>
          <p className="mt-4 whitespace-pre-line text-sm leading-7 text-gray-700">{s.description || "Ask the provider for details about the work they offer."}</p>
          <div className="mt-8 grid gap-5 border-t border-gray-100 pt-7 sm:grid-cols-2">
            <div><p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-gray-500"><Clock3 className="h-4 w-4" /> Working hours</p><p className="mt-2 text-sm font-semibold text-gray-800">{s.service_hours || "Confirm with provider"}</p></div>
            <div><p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-gray-500"><ShieldCheck className="h-4 w-4" /> Safety requirements</p><p className="mt-2 text-sm leading-6 text-gray-700">{s.safety_requirements || "Ask about applicable licences and safety requirements before agreeing work."}</p></div>
          </div>
          <div className="mt-8 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-950">This is an independent provider. Agree the scope, price and timing directly. A message or request is not a confirmed booking.</div>
          <Link href="/report" className="mt-6 inline-flex min-h-11 items-center text-sm font-bold text-[#1B4332] underline underline-offset-4">Report a service concern</Link>
        </article>
        <aside className="h-fit rounded-3xl border border-gray-100 bg-white p-5 shadow-lg shadow-[#1B4332]/5 sm:p-6">
          <p className="text-xs font-extrabold uppercase tracking-wider text-gray-500">Listed price</p>
          <p className="mt-2 text-2xl font-black text-[#1B4332]">{formatServicePrice(s.pricing_type, s.price_amount, s.price_unit)}</p>
          <p className="mt-2 text-xs leading-5 text-gray-600">Confirm the full price and any extras with the provider.</p>
          {s.whatsapp_number && <div className="mt-6"><ServiceWhatsAppLink service={{ id: s.id, business_name: s.business_name, whatsapp_number: s.whatsapp_number }} /></div>}
          <details className="mt-7 border-t border-gray-100 pt-5">
            <summary className="cursor-pointer text-sm font-bold text-[#1B4332]">Send an optional request through HousePlug</summary>
            <p className="mt-3 text-xs leading-5 text-gray-600">Your request is shared with this provider only if you consent. You can contact them directly instead.</p>
            <div className="mt-4"><ServiceEnquiryForm providerId={s.id} /></div>
          </details>
        </aside>
      </div>
    </main>
  );
}
