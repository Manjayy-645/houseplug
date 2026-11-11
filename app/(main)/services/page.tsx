import { createServiceClient } from "@/lib/supabase/server";
import { featureFlags } from "@/lib/feature-flags";
import { siteUrl } from "@/lib/site";
import { ServiceDiscovery, type DiscoveryService } from "@/components/services/service-discovery";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Housing Services Near Campus in Nigeria",
  description: "Find movers, cleaners and other housing service providers near Nigerian campuses. Compare listed starting prices and discuss the work directly with each provider.",
  alternates: { canonical: siteUrl("/services") },
};
export default async function Page({
  searchParams,
}: {
  searchParams: { category?: string; university?: string };
}) {
  let services: DiscoveryService[] = [];
  if (featureFlags.services) {
    const { data, error } = await createServiceClient()
      .from("service_providers")
      .select(
        "id,business_name,category,university,description,price_amount,pricing_type,price_unit,vetting_expires_at,listing_expires_at",
      )
      .eq("status", "active")
      .not("vetted_at", "is", null)
      .gt("vetting_expires_at", new Date().toISOString());
    if (error) {
      console.error("[SERVICES] Eligible provider lookup failed:", error.code);
    } else {
      const current = (data ?? []).filter((s) => !s.listing_expires_at || Date.parse(s.listing_expires_at) > Date.now());
      services = current;
    }
  }
  const categories = [...new Set(services.map((s) => s.category))];
  services = services.filter(
    (s) =>
      (!searchParams.category || s.category === searchParams.category) &&
      (!searchParams.university || s.university === searchParams.university),
  );
  return <ServiceDiscovery
    services={services}
    categories={categories}
    category={searchParams.category}
    university={searchParams.university}
  />;
}
