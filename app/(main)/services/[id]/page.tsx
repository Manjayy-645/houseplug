import { notFound } from "next/navigation";
import Link from "next/link";
import { featureFlags } from "@/lib/feature-flags";
import { createServiceClient } from "@/lib/supabase/server";
import { ServiceEnquiryForm } from "@/components/service-enquiry-form";
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
      "id,business_name,description,category,university,service_hours,safety_requirements,pricing_type,price_amount,price_unit,listing_expires_at",
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
  const { count } = await createServiceClient()
    .from("service_providers")
    .select("id", { count: "exact", head: true })
    .eq("category", s.category)
    .eq("status", "active")
    .not("vetted_at", "is", null)
    .gt("vetting_expires_at", new Date().toISOString());
  if ((count ?? 0) < 3) notFound();
  return (
    <main className="max-w-3xl mx-auto px-4 pt-28 pb-12 space-y-6">
      <Link href="/services" className="underline">
        Campus services
      </Link>
      <h1 className="text-3xl font-bold">{s.business_name}</h1>
      <p>{s.description}</p>
      <p>
        {s.category} · {s.university}
      </p>
      <p>Hours: {s.service_hours || "confirm with provider"}</p>
      <p>
        Safety requirements:{" "}
        {s.safety_requirements ||
          "confirm applicable licence and safety requirements before agreeing work"}
      </p>
      <p>
        Price:{" "}
        {s.price_amount == null
          ? "request a quote"
          : `₦${s.price_amount.toLocaleString("en-NG")} ${s.price_unit || ""}`}
      </p>
      <p>
        This is an independent provider, not a HousePlug contractor. Do not
        assume a request is a confirmed booking.
      </p>
      <ServiceEnquiryForm providerId={s.id} />
      <Link href="/report" className="underline">
        Report a service concern
      </Link>
    </main>
  );
}
