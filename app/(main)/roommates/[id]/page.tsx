import { RoommateConnectionButton } from "@/components/roommate-connection-button";
import { notFound } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  BadgeCheck,
  User,
  Home,
  MapPin,
  Sparkles,
  ShieldCheck,
  ArrowLeft,
  Building,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { RoommateContactButton } from "./contact-button";
import { ShareButton } from "./share-button";
import { BreadcrumbJsonLd, ProfileJsonLd } from "@/components/seo/json-ld";

import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const supabase = createServiceClient();

  const { data: roommate } = await supabase
    .from("roommate_profiles")
    .select("intent, university, budget_min, budget_max, user_id")
    .eq("id", params.id)
    .single();

  if (!roommate) {
    return {
      title: "Roommate Profile | HousePlug",
      description: "View roommate profile on HousePlug.",
    };
  }

  // Fetch user's name for a personal share preview
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", roommate.user_id)
    .single();

  const firstName = userProfile?.full_name?.split(" ")[0] || "A student";

  const title =
    roommate.intent === "have_room"
      ? `${firstName} has a room near ${roommate.university} — wanna move in? | HousePlug`
      : `${firstName} needs a roommate near ${roommate.university} — wanna team up? | HousePlug`;

  const description = `Check out ${firstName}'s roommate profile on HousePlug! Budget: ₦${roommate.budget_min.toLocaleString("en-NG")} – ₦${roommate.budget_max.toLocaleString("en-NG")}/yr near ${roommate.university}. Connect and team up for housing!`;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.houseplug.ng";
  // Dynamic OG image endpoint — renders a branded PNG card on the fly,
  // converting .webp avatars server-side so WhatsApp always gets a valid preview.
  const ogImageUrl = `${baseUrl}/api/og/roommate?id=${params.id}`;

  const displayName = userProfile?.full_name?.split(" ")[0] || "Student";

  return {
    title,
    description,
    robots: { index: false, follow: false },
    alternates: {
      canonical: `${baseUrl}/roommates/${params.id}`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/roommates/${params.id}`,
      siteName: "HousePlug",
      locale: "en_NG",
      type: "profile",
      images: [
        {
          url: ogImageUrl,
          secureUrl: ogImageUrl,
          width: 1200,
          height: 630,
          type: "image/png",
          alt: `${displayName} Roommate Profile on HousePlug`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function RoommateProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const serviceClient = createServiceClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const currentUserId = session?.user?.id;
  const isGuest = !currentUserId;

  // Fetch current user's role (only if logged in)
  let currentUserRole: string | null = null;
  if (currentUserId) {
    const { data: currentUserProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUserId)
      .single();
    currentUserRole = currentUserProfile?.role ?? null;
  }

  // Fetch roommate profile using service client to guarantee availability
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: roommate } = await serviceClient
    .from("roommate_profiles")
    .select("*")
    .eq("id", params.id)
    .eq("status", "active")
    .eq("visibility_consent", true)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!roommate) {
    notFound();
  }

  // Fetch user profile using serviceClient so RLS never hides public profile info
  const { data: userProfile } = await serviceClient
    .from("profiles")
    .select("id, full_name, avatar_url, verification_status")
    .eq("id", roommate.user_id)
    .single();

  const data = {
    ...roommate,
    // Strictly protect phone_number for guests
    phone_number: "",
    room_address: "",
    profile: userProfile
      ? {
          ...userProfile,
          full_name: userProfile.full_name?.split(" ")[0] || "Student",
        }
      : {
          full_name: "Student",
          avatar_url: null,
          verification_status: "unverified",
        },
  };

  const isVerified = data.profile.verification_status === "verified";

  return (
    <main className="min-h-screen bg-[#F9FAFB] pt-24 pb-20">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Roommates", url: "/roommates" },
          { name: `${data.profile.full_name}`, url: `/roommates/${params.id}` },
        ]}
      />
      <ProfileJsonLd
        name={data.profile.full_name}
        username={data.profile.full_name}
        role="student"
        image={data.profile.avatar_url}
        description={`Student near ${data.university} seeking a roommate. Budget: ₦${data.budget_min.toLocaleString("en-NG")} – ₦${data.budget_max.toLocaleString("en-NG")}/year.`}
      />
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/roommates"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 font-semibold transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to listings
          </Link>
          <ShareButton
            url={`https://www.houseplug.ng/roommates/${params.id}`}
            firstName={data.profile.full_name?.split(" ")[0]}
            intent={data.intent}
          />
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div
            className={`px-6 py-4 flex items-center justify-between text-white ${data.intent === "have_room" ? "bg-[#F59E0B]" : "bg-[#1B4332]"}`}
          >
            <span className="flex items-center gap-2 text-sm font-black uppercase tracking-wider">
              {data.intent === "have_room" ? (
                <>
                  <Home className="h-5 w-5" /> Has a Room
                </>
              ) : (
                <>
                  <User className="h-5 w-5" /> Looking to Team Up
                </>
              )}
            </span>
          </div>

          <div className="p-8 space-y-8">
            {/* Profile Main Info */}
            <div className="flex items-center gap-5 border-b border-gray-100 pb-6">
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  minWidth: "72px",
                  minHeight: "72px",
                  maxWidth: "72px",
                  maxHeight: "72px",
                  borderRadius: "9999px",
                }}
                className="relative shrink-0 overflow-hidden rounded-full border-2 border-[#1B4332]/10 bg-[#1B4332] shadow-xs select-none"
              >
                {data.profile.avatar_url ? (
                  <img
                    src={data.profile.avatar_url}
                    alt={data.profile.full_name || "Student"}
                    width={72}
                    height={72}
                    style={{
                      width: "72px",
                      height: "72px",
                      minWidth: "72px",
                      minHeight: "72px",
                      maxWidth: "72px",
                      maxHeight: "72px",
                      borderRadius: "9999px",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "72px",
                      height: "72px",
                      minWidth: "72px",
                      minHeight: "72px",
                      borderRadius: "9999px",
                    }}
                    className="flex items-center justify-center bg-[#1B4332] text-white font-black text-2xl uppercase"
                  >
                    {(
                      data.profile.full_name?.split(" ")[0]?.[0] || "S"
                    ).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h1 className="font-bold text-2xl text-gray-900 flex items-center gap-2">
                  {data.profile.full_name || "Student"}
                  {isVerified && (
                    <BadgeCheck className="h-6 w-6 text-emerald-500" />
                  )}
                </h1>
                <p className="text-gray-500 font-medium mt-1">
                  {data.gender} • {data.university}
                </p>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full mt-2">
                    <ShieldCheck className="h-4 w-4" /> Verified Student
                  </span>
                )}
              </div>
            </div>

            {/* Budget & Target Overview */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
                  Budget / Rent Share
                </p>
                <p className="font-black text-[#1B4332] text-xl">
                  ₦{data.budget_min.toLocaleString()} - ₦
                  {data.budget_max.toLocaleString()}
                  <span className="text-sm text-gray-500 font-normal">/yr</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
                  Preferred Roommate
                </p>
                <p className="font-bold text-gray-800 text-base capitalize">
                  {data.preferred_gender === "any"
                    ? "Any Gender"
                    : `${data.preferred_gender} Only`}
                </p>
              </div>
            </div>

            {/* Target Lodge for Splitting (If attached) */}
            {data.target_listing_title && (
              <div className="bg-gradient-to-r from-emerald-50 to-amber-50/70 p-5 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1B4332] text-white flex items-center justify-center shrink-0">
                    <Building className="w-5 h-5 text-[#F59E0B]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
                      Target Lodge For Splitting
                    </span>
                    <h3 className="text-base font-extrabold text-gray-900 mt-1">
                      {data.target_listing_title}
                    </h3>
                  </div>
                </div>
                {data.target_listing_id && (
                  <Link
                    href={`/listing/${data.target_listing_id}`}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-xs font-extrabold text-[#1B4332] hover:bg-gray-50 shadow-xs min-h-[42px]"
                  >
                    <span>View Lodge Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            )}

            {/* Room Location (If Has Room) */}
            {data.intent === "have_room" && data.room_address && (
              <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-100">
                <p className="text-xs text-amber-800 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <MapPin className="h-4 w-4 text-amber-600" /> Room Address /
                  Location
                </p>
                <p className="text-base font-semibold text-gray-800">
                  {data.room_address}
                </p>
              </div>
            )}

            {/* Complete Bio */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-[#F59E0B]" /> About Me
              </h2>
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100">
                <p className="text-gray-700 text-base leading-relaxed whitespace-pre-line">
                  {data.bio}
                </p>
              </div>
            </div>

            {/* Full Lifestyle & Preference Tags */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
                Lifestyle &amp; Preferences
              </h2>
              <div className="flex flex-wrap gap-2.5">
                {data.lifestyle_tags.map((tag: string, i: number) => (
                  <span
                    key={i}
                    className="px-4 py-2 rounded-xl bg-gray-100 text-sm font-semibold text-gray-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-6 bg-gray-50 border-t border-gray-100">
            {isGuest ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-500">
                  Sign in to contact this roommate on WhatsApp
                </p>
                <div className="flex gap-3">
                  <Link
                    href={`/login?next=/roommates/${params.id}`}
                    className="flex-1 py-3.5 rounded-xl bg-[#1B4332] text-white font-bold text-sm hover:brightness-110 transition flex items-center justify-center"
                  >
                    Log In
                  </Link>
                  <Link
                    href={`/signup?next=/roommates/${params.id}`}
                    className="flex-1 py-3.5 rounded-xl bg-[#F59E0B] text-white font-bold text-sm hover:brightness-105 transition shadow-sm flex items-center justify-center"
                  >
                    Sign Up Free
                  </Link>
                </div>
              </div>
            ) : (
              <RoommateConnectionButton targetUserId={roommate.user_id} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
