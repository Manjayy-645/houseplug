import Link from "next/link";
import { Star, Check, ArrowRight } from "lucide-react";
import type { Profile } from "@/types";
import { getInitials } from "@/lib/utils";

type LandlordCardProps = {
  landlord: Profile;
  rating: number;
  reviewCount: number;
};

export default function LandlordCard({
  landlord,
  rating,
  reviewCount,
}: LandlordCardProps) {
  const memberSinceYear = landlord.created_at
    ? new Date(landlord.created_at).getFullYear()
    : new Date().getFullYear();
  const profileLink = landlord.username
    ? `/landlord/${landlord.username}`
    : `/browse?landlord_id=${landlord.id}`;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Landlord identity */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-3.5">
          {landlord.avatar_url ? (
            <img
              src={landlord.avatar_url}
              alt={landlord.full_name}
              className="h-14 w-14 rounded-full object-cover ring-2 ring-gray-100"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1B4332] text-sm font-bold text-white ring-2 ring-[#1B4332]/10">
              {getInitials(landlord.full_name)}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-bold text-gray-900 truncate leading-snug">
              {landlord.full_name}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Member since {memberSinceYear}
            </p>

            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-[#F59E0B] text-[#F59E0B]" />
                <span className="text-sm font-bold text-gray-800 leading-none">
                  {reviewCount ? rating.toFixed(1) : "New"}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 border-t border-gray-100" />

      {/* Info & CTA */}
      <div className="p-5 pt-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <Check className="h-3.5 w-3.5" />
            {landlord.verification_status === "verified"
              ? "Advertiser identity checked"
              : "Identity not confirmed"}
          </div>
          <span className="text-xs text-gray-400">·</span>
          <p className="text-xs text-gray-500">
            Ask the advertiser to confirm a response time
          </p>
        </div>

        <Link
          href={profileLink}
          className="group flex items-center justify-center gap-2 w-full rounded-xl bg-[#1B4332] px-4 py-3 text-center text-sm font-semibold text-white transition-all hover:bg-[#143728] active:scale-[0.98] shadow-sm shadow-[#1B4332]/10"
        >
          View all listings
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}
