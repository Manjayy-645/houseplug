export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { DEFAULT_OG_IMAGE } from "@/lib/site";
import { HousingRequestsBanner } from "@/components/housing-requests/housing-requests-banner";
import { HousingRequestForm } from "@/components/housing-request-form";
import { featureFlags } from "@/lib/feature-flags";
import { ShieldCheck, Zap, Users, ExternalLink, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Student Housing Assistance | Free Lodge Finding Service | HousePlug",
  description:
    "Can't find a room that fits your budget? Post what you need for free. Verified partner agents search for you near UniPort, RSU, IAUE, and KenPoly.",
  alternates: { canonical: "https://www.houseplug.ng/housing-assistance" },
  openGraph: {
    title: "Student Housing Assistance | Free Lodge Finding Service | HousePlug",
    description:
      "Can't find your ideal lodge? Submit a free housing request. Verified partner agents search for you.",
    url: "https://www.houseplug.ng/housing-assistance",
    siteName: "HousePlug",
    locale: "en_NG",
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Student Housing Assistance | HousePlug",
    description:
      "Submit your lodge requirements for free. Verified partner agents search for you near Port Harcourt campuses.",
    images: [DEFAULT_OG_IMAGE.url],
  },
};

export default function HousingAssistancePage({
  searchParams,
}: {
  searchParams?: { listing?: string; university?: string };
}) {
  // Map university param to default campus zone if provided
  const initialCampusZone =
    searchParams?.university === "uniport"
      ? "Choba"
      : searchParams?.university === "rsu"
      ? "Rumosi"
      : undefined;

  const initialNotes = searchParams?.listing
    ? `Requesting alternatives for listing #${searchParams.listing}`
    : undefined;

  return (
    <main className="min-h-screen bg-[#F9FAFB] pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Hero Section */}
        <div className="relative text-center max-w-3xl mx-auto space-y-3 pt-2 sm:pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/70 border border-emerald-200 text-[#1B4332] text-xs font-black uppercase tracking-wider shadow-xs">
            <span>📢</span>
            <span>100% Free Service for Students &amp; Agents</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#111827] tracking-tight">
            Student Housing <span className="text-[#1B4332]">Assistance</span>
          </h1>

          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Can’t find a room that fits your budget? Post what you need for free. Verified partner agents search for you and we connect you directly on WhatsApp.
          </p>
        </div>

        {/* 3 Value Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-gray-200/70 shadow-xs">
            <div className="p-2 rounded-xl bg-emerald-50 text-[#1B4332] shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">100% Free Intake</h2>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                Zero fees or deductions to post your request.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-gray-200/70 shadow-xs">
            <div className="p-2 rounded-xl bg-amber-50 text-[#F59E0B] shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Partner Agents Network</h2>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                Broadcasted to verified agents near campus gates.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-gray-200/70 shadow-xs">
            <div className="p-2 rounded-xl bg-emerald-50 text-[#10B981] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Direct WhatsApp Chat</h2>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                Receive photos &amp; inspect before paying any landlord.
              </p>
            </div>
          </div>
        </div>

        {/* Prominent CTA Banner with Fast Intake Modal Trigger */}
        <HousingRequestsBanner
          variant="default"
          initialCampusZone={initialCampusZone}
          initialNotes={initialNotes}
        />

        {/* Direct staff assistance form when feature flag is enabled or deep-linked from listing */}
        {featureFlags.housingRequests ? (
          <section
            aria-labelledby="direct-request-heading"
            className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-4 max-w-3xl mx-auto"
          >
            <div className="border-b border-gray-100 pb-3">
              <h2 id="direct-request-heading" className="text-lg font-bold text-[#111827]">
                Submit Housing Request Form
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                {searchParams?.listing
                  ? "Looking for an alternative to this specific listing? Tell us your preferred area and budget."
                  : "Tell us your campus, preferred area, total move-in budget and date. We’ll help check suitable options."}
              </p>
            </div>
            <HousingRequestForm
              listingId={searchParams?.listing}
              campus={searchParams?.university}
            />
          </section>
        ) : null}

        {/* How Housing Assistance Works Section */}
        <section className="rounded-3xl bg-linear-to-br from-[#1B4332]/5 to-[#F59E0B]/5 border border-gray-200 p-6 sm:p-8 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <span className="text-[11px] font-bold text-[#1B4332] uppercase tracking-wider">
              Clear &amp; Transparent
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-[#111827]">
              How Housing Assistance Works
            </h3>
            <p className="text-xs text-gray-500">
              Connecting students seeking lodges with verified partner agents in minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-[#1B4332] text-white flex items-center justify-center font-black text-sm">
                1
              </div>
              <h4 className="text-sm font-bold text-gray-900">1. Student Submits Free Request</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Tell us your campus area (Choba, Aluu, Nkpolu, etc.), budget range, and move-in timeline. No fee is ever required.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-[#F59E0B] text-white flex items-center justify-center font-black text-sm">
                2
              </div>
              <h4 className="text-sm font-bold text-gray-900">2. Instant Broadcast to Partner Agents</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Your request details are broadcasted to verified agents near campus gates without exposing private contact info.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-[#10B981] text-white flex items-center justify-center font-black text-sm">
                3
              </div>
              <h4 className="text-sm font-bold text-gray-900">3. Direct Photos &amp; Inspection</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Agents with matching vacant lodges submit photos directly, and you connect safely to inspect before paying any landlord.
              </p>
            </div>
          </div>
        </section>

        {/* Landlord & Partner Agent Network CTA */}
        <div className="bg-linear-to-r from-emerald-50 via-white to-amber-50/60 rounded-3xl border border-emerald-200/90 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#1B4332] text-xs font-bold uppercase tracking-wider">
              <span>🏘️</span>
              <span>For Landlords &amp; Off-Campus Agents</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-[#111827]">
              Got vacant lodges near UniPort, RSU, or IAUE?
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Join our official Partner Agents &amp; Landlords WhatsApp Channel to receive student accommodation requests directly, claim qualified leads, and fill vacant rooms faster.
            </p>
          </div>

          <a
            href="https://chat.whatsapp.com/KmewWrx2i9hCgsTCHoPGgU"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#1B4332] hover:bg-[#133024] active:scale-[0.98] text-white font-extrabold text-sm shadow-md transition-all shrink-0 w-full md:w-auto"
          >
            <span className="text-base leading-none">📲</span>
            <span>Join Partner Agents Group</span>
            <ExternalLink className="w-4 h-4 text-emerald-300" />
          </a>
        </div>
      </div>
    </main>
  );
}
