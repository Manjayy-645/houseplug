import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE } from "@/lib/site";
import { createClient, getAdminClient } from "@/lib/supabase/server";
import { getOpenHousingRequests } from "@/app/actions/housing-requests";
import { PublicRequestsBoard } from "@/components/housing-requests/public-requests-board";
import { HousingRequestsBanner } from "@/components/housing-requests/housing-requests-banner";

export const metadata: Metadata = {
  title: "Student Housing Request Board | Free Off-Campus Lodge Finder | HousePlug",
  description:
    "Post your lodge requirements for free or browse active student requests near UniPort, RSU, IAUE, and KenPoly. Instant match with verified partner agents.",
  openGraph: {
    title: "Student Housing Request Board | HousePlug",
    description:
      "Can't find your ideal lodge? Post a free housing request. Verified partner agents search for you.",
    url: "https://www.houseplug.ng/requests",
    siteName: "HousePlug",
    locale: "en_NG",
    type: "website",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Student Housing Request Board | HousePlug",
    description:
      "Post your lodge requirements for free or browse active student requests near UniPort, RSU, IAUE, and KenPoly.",
    images: [DEFAULT_OG_IMAGE.url],
  },
};

export const revalidate = 30; // revalidate every 30 seconds

export default async function HousingRequestsPage() {
  const { requests } = await getOpenHousingRequests();

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Hero Section */}
        <div className="relative text-center max-w-3xl mx-auto space-y-3 pt-4 sm:pt-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/70 border border-emerald-200 text-[#1B4332] text-xs font-black uppercase tracking-wider shadow-xs">
            <span>📢</span>
            <span>100% Free Service for Students &amp; Agents</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#111827] tracking-tight">
            Student Housing <span className="text-[#1B4332]">Request Board</span>
          </h1>

          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Can’t find your ideal off-campus accommodation? Post your budget and preferred location for free. We broadcast your request directly to verified partner agents who have vacant rooms!
          </p>
        </div>

        {/* Prominent CTA Banner */}
        <HousingRequestsBanner variant="default" />

        {/* Requests Board & Filter System */}
        <PublicRequestsBoard
          initialRequests={requests}
          isAdmin={isAdmin}
        />
      </div>
    </main>
  );
}
