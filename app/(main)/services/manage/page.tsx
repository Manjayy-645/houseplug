import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ServiceSubmissionForm, type EditableService } from "@/components/services/service-submission-form";

export const metadata = { title: "List a Housing Service", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ManageServicesPage({ searchParams }: { searchParams: { edit?: string } }) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) redirect("/login?next=/services/manage");
  const { data: services } = await createServiceClient().from("service_providers")
    .select("id,business_name,category,university,description,pricing_type,price_amount,price_unit,whatsapp_number,status")
    .eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
  const editable = services?.find((service) => service.id === searchParams.edit) as EditableService | undefined;
  return <main className="min-h-screen bg-[#F9FAFB] px-4 pb-24 pt-28 sm:px-6">
    <div className="mx-auto max-w-4xl">
      <Link href="/services" className="inline-flex min-h-11 items-center text-sm font-bold text-[#1B4332] underline underline-offset-4">← Explore services</Link>
      <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-700">Housing services</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">{editable ? "Update your service" : "List your service for free"}</h1>
      <p className="mb-7 mt-3 max-w-2xl text-sm leading-7 text-gray-600">Students and landlords can contact you directly on WhatsApp once your listing is reviewed. State a real starting or fixed price and what it covers. HousePlug does not book jobs or collect your service fees.</p>
      <ServiceSubmissionForm key={editable?.id || "new"} service={editable} />
      {(services?.length ?? 0) > 0 && <section className="mt-10"><h2 className="text-xl font-black text-gray-900">Your services</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{services?.map((service) => <article key={service.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><h3 className="font-bold text-gray-900">{service.business_name}</h3><p className="mt-1 text-sm text-gray-600">{service.category} · {service.status === "active" ? "Live" : service.status === "pending" ? "In review" : "Paused"}</p><Link href={`/services/manage?edit=${service.id}`} className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-[#1B4332] underline underline-offset-4">Edit service</Link></article>)}</div></section>}
    </div>
  </main>;
}
