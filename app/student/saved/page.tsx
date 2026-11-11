import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ListingCard } from "@/components/listing-card";
import { Heart, ArrowRight } from "lucide-react";
import type { Listing } from "@/types";

export const dynamic = "force-dynamic";

export default async function StudentSavedPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: savedData } = await supabase
    .from("saved_listings")
    .select(
      "listing_id, listing:listings(*, landlord:profiles!landlord_id(full_name, verification_status, role))",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const savedListings = (savedData?.map((item) => ({
    ...(item.listing as any),
    is_saved: true,
  })) ?? []) as unknown as Listing[];

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <header>
        <p className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]">
          Student Dashboard
        </p>
        <h1 className="text-2xl font-bold text-gray-900">Saved Lodges</h1>
        <p className="text-sm text-gray-500 mt-1">
          Lodges you&apos;ve bookmarked for later.
        </p>
      </header>

      {savedListings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <Heart className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            No saved lodges yet
          </h2>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            Tap the heart icon on any listing to save it here.
          </p>
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 bg-[#1B4332] text-white rounded-xl px-6 py-3 font-bold hover:brightness-110 transition"
          >
            Browse Listings <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {savedListings.map((listing, index) => (
            <ListingCard key={listing.id} listing={listing} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
