import Link from "next/link";
import { ArrowRight, ArrowUpRight, CheckCircle2, MapPin, Search, Wrench } from "lucide-react";
import { UNIVERSITIES } from "@/lib/constants";

export type DiscoveryService = {
  id: string;
  business_name: string;
  category: string;
  university: string;
  description: string | null;
  price_amount: number | null;
  pricing_type: string | null;
  price_unit: string | null;
  listing_expires_at: string | null;
};

function priceLabel(service: DiscoveryService) {
  if (service.price_amount == null || service.pricing_type === "quote") return "Ask for a quote";
  const amount = "₦" + service.price_amount.toLocaleString("en-NG");
  return (service.pricing_type === "starting_from" ? "From " : "") + amount + (service.price_unit ? " / " + service.price_unit : "");
}

export function ServiceDiscovery({ services, categories, category, university }: {
  services: DiscoveryService[];
  categories: string[];
  category?: string;
  university?: string;
}) {
  return (
    <main className="min-h-screen bg-[#F9FAFB] pb-24">
      <section className="relative overflow-hidden bg-[#1B4332] pt-24 pb-24 text-white sm:pt-28 sm:pb-28">
        <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-[#F59E0B]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-0 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.15em] text-amber-200">
            <Wrench className="h-3.5 w-3.5" /> Campus services
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            Get help around campus, <span className="text-[#F59E0B]">on your terms.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-emerald-50/90 sm:text-lg">
            Explore independent local providers. Discuss the work, price and timing directly with them before you agree.
          </p>
          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-emerald-50/90 sm:text-sm">
            <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#F59E0B]" /> Discuss service scope</span>
            <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#F59E0B]" /> Direct provider contact</span>
          </div>
        </div>
      </section>

      <div className="relative mx-auto -mt-14 max-w-6xl px-4 sm:px-6 lg:px-8">
        <form action="/services" method="get" className="grid gap-4 rounded-3xl border border-gray-100 bg-white p-4 shadow-xl shadow-[#1B4332]/10 sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:p-6">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-600">
            Service
            <select name="category" defaultValue={category || ""} className="mt-2 block min-h-12 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#1B4332] focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/15">
              <option value="">All available categories</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-600">
            Campus
            <select name="university" defaultValue={university || ""} className="mt-2 block min-h-12 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-[#1B4332] focus:border-[#1B4332] focus:outline-none focus:ring-2 focus:ring-[#1B4332]/15">
              <option value="">All campuses</option>
              {UNIVERSITIES.map((campus) => <option key={campus.id} value={campus.id}>{campus.shortName}</option>)}
            </select>
          </label>
          <button className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#F59E0B] px-6 text-sm font-extrabold text-[#143728] shadow-sm transition hover:bg-amber-400 sm:w-auto">
            <Search className="h-4 w-4" /> Find providers
          </button>
        </form>

        <section className="pt-10 sm:pt-14">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-700">Local help</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">Providers near your campus</h2>
              <p className="mt-2 text-sm text-gray-600">Showing {services.length} currently eligible {services.length === 1 ? "provider" : "providers"}.</p>
            </div>
            <Link href="/services/manage" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#1B4332]/20 bg-white px-4 text-sm font-bold text-[#1B4332] hover:bg-emerald-50">
              List a housing service free <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          {services.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <article key={service.id} className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:p-6">
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#1B4332]"><Wrench className="h-6 w-6" /></div>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-900">{service.category}</span>
                  </div>
                  <h3 className="text-lg font-black text-gray-900">{service.business_name}</h3>
                  <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-gray-500"><MapPin className="h-3.5 w-3.5" />{UNIVERSITIES.find((campus) => campus.id === service.university)?.shortName || service.university}</p>
                  <p className="mt-4 line-clamp-3 flex-1 text-sm leading-6 text-gray-600">{service.description || "Ask the provider about the work they can do."}</p>
                  <p className="mt-5 border-t border-gray-100 pt-4 text-sm font-bold text-[#1B4332]">{priceLabel(service)}</p>
                  <Link href={"/services/" + service.id} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1B4332] px-4 text-sm font-bold text-white transition hover:bg-[#143728]">
                    View service details <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-gray-100 bg-white px-5 py-12 text-center shadow-sm sm:px-8 sm:py-16">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-[#1B4332]"><Wrench className="h-8 w-8" /></div>
              <h3 className="mt-6 text-xl font-black text-gray-900 sm:text-2xl">Providers are being reviewed</h3>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-gray-600">No reviewed providers are live yet. If you offer a housing-related service, you can submit it for free.</p>
              <Link href="/services/manage" className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1B4332] px-6 text-sm font-bold text-white hover:bg-[#143728]">
                List your service <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
