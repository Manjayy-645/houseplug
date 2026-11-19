export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE } from "@/lib/site";
import { createClient, getAdminClient } from "@/lib/supabase/server";
import { getOpenHousingRequests } from "@/app/actions/housing-requests";
import { PublicRequestsBoard } from "@/components/housing-requests/public-requests-board";
import { HousingRequestsBanner } from "@/components/housing-requests/housing-requests-banner";
import { HousingRequestForm } from "@/components/housing-request-form";
import { featureFlags } from "@/lib/feature-flags";
import { ShieldCheck, Zap, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Student Housing Assistance & Request Board | HousePlug",
  description:
    "Can't find a room that fits your budget? Post a free lodge request. Verified partner agents search for you near UniPort, RSU, IAUE, and KenPoly.",
  alternates: { canonical: "https://www.houseplug.ng/housing-assistance" },
  openGraph: {
    title: "Student Housing Assistance & Request Board | HousePlug",
    description:
      "Can't find your ideal lodge? Post a free housing request. Verified partner agents search for you.",
    url: "https://www.houseplug.ng/housing-assistance",
    siteName: "HousePlug",
    locale: "en_NG",
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Student Housing Assistance & Request Board | HousePlug",
    description:
      "Post your lodge requirements for free or browse active student requests near Port Harcourt campuses.",
    images: [DEFAULT_OG_IMAGE.url],
  },
};

export const revalidate = 30; // revalidate every 30 seconds

export default async function HousingAssistancePage({
  searchParams,
}: {
  searchParams?: { listing?: string; university?: string };
}) {
  const { requests } = await getOpenHousingRequests();

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

  // Check if current user is admin to enable 1-Click WhatsApp Broadcast actions
  let isAdmin = false;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const db = getAdminClient();
      const { data: profile } = await db
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      isAdmin = ["admin", "super_admin"].includes(profile?.role || "");
    }
  } catch {
    isAdmin = false;
  }

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
            Can’t find a room that fits your budget? Post what you need for free or browse active requests. Verified partner agents search for you and we connect you directly on WhatsApp.
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
                Zero fees or deductions to post a request.
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

        {/* Prominent CTA Banner with Modal Trigger */}
        <HousingRequestsBanner
          variant="default"
          initialCampusZone={initialCampusZone}
          initialNotes={initialNotes}
        />

        {/* Direct staff assistance form when feature flag is enabled or deep-linked from listing */}
        {featureFlags.housingRequests && (
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
        )}

        {/* Live Public Requests Board */}
        <div className="pt-2">
          <PublicRequestsBoard
            initialRequests={requests}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </main>
  );
}
