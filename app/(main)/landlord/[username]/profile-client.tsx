"use client";

import { useState } from "react";
import {
  BadgeCheck,
  Phone,
  Star,
  Building2,
  MapPin,
  Calendar,
  Home,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { ListingCard } from "@/components/listing-card";
import Link from "next/link";
import type { Listing, Profile } from "@/types";

// We create a custom WhatsApp icon matching the design
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.052 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
);

type ProfileClientProps = {
  profile: Omit<Profile, "email">;
  listings: Listing[];
  reviewsCount: number;
  averageRating: number;
  yearsOnPlatform: number;
};

export function ProfileClient({
  profile,
  listings,
  reviewsCount,
  averageRating,
  yearsOnPlatform,
}: ProfileClientProps) {
  const [activeTab, setActiveTab] = useState<"listings" | "reviews">(
    "listings",
  );
  const isVerified = profile.verification_status === "verified";

  // Use first listing's whatsapp or phone as default if profile doesn't have it explicitly
  const whatsappNumber =
    listings.find((l) => l.whatsapp_number)?.whatsapp_number || profile.phone;
  const phoneNumber =
    profile.phone || listings.find((l) => l.phone_number)?.phone_number;

  const handleWhatsAppClick = () => {
    if (whatsappNumber) {
      window.open(
        `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}`,
        "_blank",
      );
    }
  };

  const handlePhoneClick = () => {
    if (phoneNumber) {
      window.open(`tel:${phoneNumber}`, "_self");
    }
  };

  const initials = profile.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "LL";

  return (
    <div className="min-h-screen bg-[#F4F6F8] pb-24">
      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1B4332] via-[#1B4332] to-[#143728]">
        {/* Decorative pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-5 pb-2">
          <Link
            href="/browse"
            className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Browse</span>
          </Link>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-white/80" />
            <span className="font-bold text-lg text-white tracking-tight">
              HousePlug
            </span>
          </div>
          <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white/80 font-medium border border-white/10">
            Agent Profile
          </span>
        </div>

        {/* Profile section */}
        <div className="relative z-10 flex flex-col items-center px-5 pt-6 pb-10">
          {/* Avatar with glow ring */}
          <div className="relative mb-5">
            <div className="absolute -inset-1.5 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full opacity-60 blur-sm" />
            <div className="relative w-[88px] h-[88px] rounded-full border-[3px] border-emerald-400 overflow-hidden bg-white/10">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/10 backdrop-blur text-white font-bold text-2xl uppercase">
                  {initials}
                </div>
              )}
            </div>
            {isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1 border-2 border-[#1B4332] shadow-lg">
                <BadgeCheck className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>

          {/* Name & badge */}
          <div className="flex items-center gap-2.5 mb-2">
            <h1 className="text-[22px] font-bold text-white tracking-tight">
              {profile.full_name}
            </h1>
            {isVerified && (
              <span className="bg-emerald-500/20 backdrop-blur-sm text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-500/30">
                <BadgeCheck className="w-3 h-3" />
                Verified
              </span>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 text-sm text-white/60 mt-1">
            <span className="flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5" />
              <span className="font-medium text-white/80">
                {listings.length}
              </span>{" "}
              Listings
            </span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span className="flex items-center gap-1 text-amber-400">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="font-semibold">
                {reviewsCount ? averageRating.toFixed(1) : "No reviews yet"}
              </span>
            </span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {yearsOnPlatform}yr
            </span>
          </div>
        </div>

        {/* Bottom curve */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto block"
          >
            <path
              d="M0 48h1440V0C1440 0 1140 48 720 48S0 0 0 0v48z"
              fill="#F4F6F8"
            />
          </svg>
        </div>
      </div>

      {/* ── Content Area ── */}
      <div className="px-4 sm:px-6 max-w-4xl mx-auto -mt-1">
        {/* Contact buttons card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900">Get in touch</h2>
            {profile.username && (
              <Link
                href={`/card/${profile.username}`}
                className="flex items-center gap-1 text-xs text-[#1B4332] font-medium hover:underline"
              >
                Share profile <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleWhatsAppClick}
              className="flex-1 bg-[#25D366] hover:bg-[#1fba58] text-white rounded-xl py-3 px-4 font-semibold text-sm flex items-center justify-center gap-2.5 transition-all active:scale-[0.97] shadow-sm shadow-[#25D366]/20"
            >
              <WhatsAppIcon className="w-5 h-5" />
              WhatsApp
            </button>
            <button
              onClick={handlePhoneClick}
              className="flex-1 bg-[#1B4332] hover:bg-[#143728] text-white rounded-xl py-3 px-4 font-semibold text-sm flex items-center justify-center gap-2.5 transition-all active:scale-[0.97] shadow-sm shadow-[#1B4332]/20"
            >
              <Phone className="w-4 h-4" />
              Call Now
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            <button
              className={`flex-1 py-4 text-center text-[15px] font-semibold transition-all relative ${
                activeTab === "listings"
                  ? "text-[#1B4332]"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              onClick={() => setActiveTab("listings")}
            >
              <span className="flex items-center justify-center gap-2">
                <Home className="w-4 h-4" />
                Listings
                {listings.length > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      activeTab === "listings"
                        ? "bg-[#1B4332]/10 text-[#1B4332]"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {listings.length}
                  </span>
                )}
              </span>
              {activeTab === "listings" && (
                <div className="absolute bottom-0 left-4 right-4 h-[3px] bg-[#1B4332] rounded-t-full" />
              )}
            </button>
            <button
              className={`flex-1 py-4 text-center text-[15px] font-semibold transition-all relative ${
                activeTab === "reviews"
                  ? "text-[#F59E0B]"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              onClick={() => setActiveTab("reviews")}
            >
              <span className="flex items-center justify-center gap-2">
                <Star className="w-4 h-4" />
                Reviews
                {reviewsCount > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      activeTab === "reviews"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {reviewsCount}
                  </span>
                )}
              </span>
              {activeTab === "reviews" && (
                <div className="absolute bottom-0 left-4 right-4 h-[3px] bg-[#F59E0B] rounded-t-full" />
              )}
            </button>
          </div>

          {/* Tab content */}
          <div className="p-4 sm:p-6">
            {activeTab === "listings" && (
              <>
                {listings.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {listings.map((listing, i) => (
                      <ListingCard
                        key={listing.id}
                        listing={listing}
                        index={i}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-16 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                      <Home className="w-7 h-7 text-gray-300" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 mb-1">
                      No Active Listings
                    </h3>
                    <p className="text-sm text-gray-500 max-w-xs">
                      This agent doesn&apos;t have any active listings right
                      now. Check back later!
                    </p>
                  </div>
                )}
              </>
            )}

            {activeTab === "reviews" && (
              <div className="py-16 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
                  <Star className="w-7 h-7 text-amber-300" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-1">
                  No Reviews Yet
                </h3>
                <p className="text-sm text-gray-500 max-w-xs">
                  This agent hasn&apos;t received any reviews yet. Be the first
                  to leave one after renting!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer branding */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Powered by{" "}
            <Link
              href="/"
              className="text-[#1B4332] font-semibold hover:underline"
            >
              HousePlug
            </Link>{" "}
            · Compare student housing details and contact advertisers
          </p>
        </div>
      </div>
    </div>
  );
}
