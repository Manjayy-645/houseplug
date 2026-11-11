import { createServiceClient } from "@/lib/supabase/server";
import { featureFlags } from "@/lib/feature-flags";
import { siteUrl } from "@/lib/site";
import { ServiceDiscovery, type DiscoveryService } from "@/components/services/service-discovery";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Campus Services in Port Harcourt",
  description: "Find local movers, cleaners and other campus service providers near Port Harcourt universities. Discuss scope and prices directly with each provider.",
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
      const counts = new Map<string, number>();
      for (const s of current) {
        const key = s.university + ":" + s.category;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      services = current.filter((s) => (counts.get(s.university + ":" + s.category) ?? 0) >= 3);
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
