import { publicListing } from "@/lib/public-listing";
import { createServiceClient as createClient } from "@/lib/supabase/server";
import { ListingCard } from "@/components/listing-card";
import { TrendingUp } from "lucide-react";
import type { Listing } from "@/types";

export const dynamic = "force-dynamic";

export async function TrendingStrip() {
  const supabase = createClient();

  let sectionLabel = "New this week";

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Try 7 days first
  let { data: trendingListings } = await supabase
    .from("listings")
    .select(
      `
      *,
      landlord:profiles!landlord_id(full_name, verification_status, role)
    `,
    )
    .eq("status", "active")
    .eq("availability_state", "active")
    .gt("availability_expires_at", new Date().toISOString())
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("views_count", { ascending: false })
    .limit(10);

  // Widen to 14 days if < 5
  if (!trendingListings || trendingListings.length < 5) {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    sectionLabel = "Recently added";

    const { data: widerListings } = await supabase
      .from("listings")
      .select(
        `
        *,
        landlord:profiles!landlord_id(full_name, verification_status, role)
      `,
      )
      .eq("status", "active")
      .eq("availability_state", "active")
      .gt("availability_expires_at", new Date().toISOString())
      .gte("created_at", fourteenDaysAgo.toISOString())
      .order("views_count", { ascending: false })
      .limit(10);

    trendingListings = widerListings || [];
  }

  if (!trendingListings || trendingListings.length === 0) {
    return null;
  }

  return (
    <section className="py-10 sm:py-12 bg-gray-50 border-b border-gray-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-0 md:px-20">
        <div className="flex items-center gap-2 mb-6 sm:mb-8 px-5">
          <TrendingUp className="h-6 w-6 text-[#F59E0B]" />
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            {sectionLabel}
          </h2>
        </div>

        <div className="flex flex-row gap-4 sm:gap-5 overflow-x-auto pb-4 sm:pb-6 px-5 md:px-0 scrollbar-hide snap-x md:grid md:grid-cols-3 lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:pb-0">
          {trendingListings.map((listing, index) => (
            <div
              key={listing.id}
              className="min-w-[280px] sm:min-w-[320px] snap-start md:min-w-0"
            >
              <ListingCard listing={listing as Listing} index={index} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
