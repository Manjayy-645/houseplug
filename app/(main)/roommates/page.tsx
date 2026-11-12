import Link from "next/link";
import type { Metadata } from "next";
import { createClient, getAdminClient } from "@/lib/supabase/server";
import { RoommateCard } from "@/components/roommate-card";
import { Users, ArrowRight, Sparkles } from "lucide-react";
import { RoommateFilters } from "@/components/roommate-filters";
import { BreadcrumbJsonLd } from "@/components/seo/json-ld";
import { computeComprehensiveMatchScore } from "@/lib/roommate-matching";
import { UNIVERSITIES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Find a Student Roommate in Nigeria",
  description:
    "Connect with students across UniPort, RSU, IAUE, and KenPoly. Team up to split lodge rent and find your ideal roommate safely.",
  alternates: {
    canonical: "https://www.houseplug.ng/roommates",
  },
  openGraph: {
    title: "Find a Student Roommate in Nigeria | HousePlug",
    description:
      "Connect with students near UniPort, RSU, IAUE, and KenPoly. Split rent and save on off-campus accommodation.",
    url: "https://www.houseplug.ng/roommates",
    siteName: "HousePlug",
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Find a Student Roommate | HousePlug",
    description:
      "Find verified student roommates near your campus. Connect with consent and split lodge rent.",
  },
};

export default async function RoommatesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = createClient();
  const db = getAdminClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const currentUserId = session?.user?.id;
  const isGuest = !currentUserId;

  // Fetch current user's role if logged in
  let currentUserRole: string | null = null;
  if (currentUserId) {
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUserId)
      .single();
    currentUserRole = userProfile?.role ?? null;
  }

  // Fetch current user's roommate profile for match scoring
  let currentUserRoommateProfile = null;
  if (currentUserId) {
    try {
      const { data: myProfile } = await db
        .from("roommate_profiles")
        .select(
          "id, user_id, university, budget_min, budget_max, gender, preferred_gender, lifestyle_tags, target_listing_id, target_listing_title, room_address,score_opt_in",
        )
        .eq("user_id", currentUserId)
        .maybeSingle();
      currentUserRoommateProfile = myProfile;
    } catch {
      // Best effort
    }
  }

  // Build query — public active roommate profiles (excludes phone_number to protect privacy)
  let query = db
    .from("roommate_profiles")
    .select(
      "id, user_id, intent, university, budget_min, budget_max, gender, preferred_gender, lifestyle_tags, bio, room_photos, room_address, target_listing_id, target_listing_title, status, created_at, updated_at",
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });

  // Apply filters
  const intent =
    typeof searchParams.intent === "string" ? searchParams.intent : null;
  const gender =
    typeof searchParams.gender === "string" ? searchParams.gender : null;
  const q =
    typeof searchParams.q === "string" ? searchParams.q.toLowerCase().trim() : null;
  const verifiedOnly = searchParams.verified === "true";
  const campus =
    typeof searchParams.campus === "string" ? searchParams.campus.trim() : null;

  if (intent) query = query.eq("intent", intent);

  // Resilient campus filtering matching shortName, name, or id
  if (campus) {
    const campusObj = UNIVERSITIES.find(
      (u) =>
        u.id.toLowerCase() === campus.toLowerCase() ||
        u.shortName.toLowerCase() === campus.toLowerCase() ||
        u.name.toLowerCase() === campus.toLowerCase(),
    );
    if (campusObj) {
      query = query.or(
        `university.ilike.%${campusObj.shortName}%,university.ilike.%${campusObj.name}%,university.ilike.%${campusObj.id}%`,
      );
    } else {
      query = query.ilike("university", `%${campus}%`);
    }
  }

  if (gender) query = query.ilike("gender", gender);
  // Text search on university or bio
  if (q) query = query.or(`university.ilike.%${q}%,bio.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) {
    console.error("[ROOMMATES_PAGE] Error fetching profiles:", error);
  }
  let profiles: any[] = data || [];

  // If we have profiles, fetch their corresponding public.profiles data via db
  // to guarantee public full_name, avatar_url, and verification status are never blocked by RLS
  if (profiles.length > 0) {
    const userIds = profiles.map((p) => p.user_id).filter(Boolean);
    const { data: usersProfiles } = await db
      .from("profiles")
      .select("id, full_name, avatar_url, verification_status")
      .in("id", userIds);

    if (usersProfiles) {
      profiles = profiles.map((p) => ({
        ...p,
        profile: (() => {
          const profile = usersProfiles.find((up) => up.id === p.user_id);
          return profile
            ? {
                ...profile,
                full_name: profile.full_name?.split(" ")[0] || "Student",
              }
            : null;
        })(),
      }));
    }

    // Filter out unverified if verifiedOnly is true
    if (verifiedOnly) {
      profiles = profiles.filter(
        (p) => p.profile?.verification_status === "verified",
      );
    }
  }

  // Calculate top compatible matches for logged in student
  const topMatches =
    currentUserRoommateProfile && currentUserRoommateProfile.score_opt_in
      ? profiles
          .filter((p: any) => p.user_id !== currentUserId)
          .map((p: any) => {
            const matchResult = computeComprehensiveMatchScore(
              currentUserRoommateProfile,
              p,
            );
            return {
              ...p,
              matchResult,
            };
          })
          .filter(
            (p: any) => p.matchResult.isEligible && p.matchResult.score >= 50,
          )
          .sort((a: any, b: any) => b.matchResult.score - a.matchResult.score)
          .slice(0, 3)
      : [];

  profiles = profiles.map((p) => ({
    ...p,
    phone_number: "",
    room_address: "",
  }));
  return (
    <main className="min-h-screen bg-[#F9FAFB] pt-24 pb-20">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Find a Roommate", url: "/roommates" },
        ]}
      />
      {/* Hero Section */}
      <section className="bg-[#1B4332] py-16 px-5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg
            className="h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path d="M0,100 C30,60 70,60 100,100 L100,0 L0,0 Z" fill="white" />
          </svg>
        </div>
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="max-w-2xl text-white">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-6">
              <Users className="h-4 w-4 text-[#F59E0B]" />
              New Feature
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              Find your perfect <span className="text-[#F59E0B]">roommate</span>
              .
            </h1>
            <p className="text-base md:text-lg text-white/80 mb-8 max-w-xl leading-relaxed">
              Have a room that permits sharing, or want to search together?
              Compare campuses and budgets, then request a private connection.
              Contact details are shared only after both students agree.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/roommates/create"
                className="w-full sm:w-auto bg-[#F59E0B] text-white px-8 py-4 rounded-xl font-bold hover:brightness-105 transition shadow-lg shadow-amber-500/20 active:scale-95 inline-block text-center text-lg"
              >
                Create a Profile
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Guest Sign-up Prompt Banner */}
      {isGuest && (
        <div className="bg-gradient-to-r from-[#F59E0B]/10 via-amber-50 to-[#F59E0B]/10 border-y border-amber-200/60">
          <div className="max-w-7xl mx-auto px-5 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="shrink-0 h-10 w-10 rounded-full bg-[#F59E0B]/20 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-[#F59E0B]" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">
                  You&apos;re browsing as a guest
                </p>
                <p className="text-gray-500 text-sm">
                  Create a free student account to request a private roommate
                  connection. Contact details require mutual agreement.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-700 hover:bg-white transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1B4332] text-white text-sm font-bold hover:bg-[#143326] transition-colors shadow-sm"
              >
                Sign Up Free <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-5 py-8 sm:py-12">
        {/* Top Compatible Matches Strip for logged-in students */}
        {topMatches.length > 0 && (
          <div className="mb-10 rounded-3xl border-2 border-emerald-500/25 bg-gradient-to-br from-emerald-50/70 via-white to-amber-50/50 p-4 sm:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1B4332] text-white text-[10px] font-black uppercase tracking-wider mb-1.5 shadow-xs">
                  <Sparkles className="w-3 h-3 text-[#F59E0B]" />
                  <span>Smart Match Engine</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  Top Roommate Matches For You
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 font-medium">
                  Ranked by mutual campus, overlapping budget, and compatible
                  lifestyle preferences.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-full self-start sm:self-auto">
                {topMatches.length} high-match{" "}
                {topMatches.length === 1 ? "roommate" : "roommates"}
              </span>
            </div>

            {/* Mobile Horizontal Snap Scroll / Desktop Grid */}
            <div className="flex gap-4 overflow-x-auto pb-4 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible snap-x snap-mandatory">
              {topMatches.map((item: any) => (
                <div
                  key={`match-${item.id}`}
                  className="w-[285px] sm:w-auto min-w-[285px] sm:min-w-0 shrink-0 sm:shrink max-w-full snap-start flex"
                >
                  <RoommateCard
                    data={item}
                    currentUserId={currentUserId}
                    currentUserRole={currentUserRole}
                    matchScore={item.matchResult.score}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters Bar */}
        <RoommateFilters />

        {profiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 w-full">
            {profiles.map((profile: any) => {
              const score =
                currentUserRoommateProfile && profile.user_id !== currentUserId
                  ? computeComprehensiveMatchScore(
                      currentUserRoommateProfile,
                      profile,
                    ).score
                  : null;

              return (
                <div key={profile.id} className="w-full min-w-0 max-w-full flex">
                  <RoommateCard
                    data={profile}
                    currentUserId={currentUserId}
                    currentUserRole={currentUserRole}
                    matchScore={score && score >= 50 ? score : null}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-xs">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-[#1B4332]">
              <Users className="h-7 w-7 text-[#1B4332]" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              No roommate profiles found
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
              {q || intent || gender || campus || verifiedOnly
                ? "Try relaxing your filters to see more student roommate posts, or post your own."
                : "Be the first student to post a roommate request on campus!"}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {(q || intent || gender || campus || verifiedOnly) && (
                <Link
                  href="/roommates"
                  className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
                >
                  Clear all filters
                </Link>
              )}
              <Link
                href="/roommates/create"
                className="px-6 py-2.5 rounded-xl bg-[#1B4332] text-white text-sm font-bold hover:bg-[#143326] transition shadow-xs"
              >
                Create a Profile
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
