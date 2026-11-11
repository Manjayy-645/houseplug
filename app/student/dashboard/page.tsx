import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import {
  Heart,
  Users,
  Star,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  Search,
  CheckCircle2,
  Clock,
  User,
} from "lucide-react";
import type { Listing } from "@/types";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [
    { data: profile },
    { data: savedData },
    { data: roommateProfile },
    { data: reviewsGiven },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("saved_listings")
      .select(
        "listing_id, listing:listings(*, landlord:profiles!landlord_id(full_name, verification_status, role))",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("roommate_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("reviews")
      .select("id, rating, review_text, created_at, listing:listings(title)")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  if (!profile) redirect("/login");

  const firstName = profile.full_name?.split(" ")[0] ?? "Student";
  const savedListings = (savedData?.map((item) => ({
    ...(item.listing as any),
    is_saved: true,
  })) ?? []) as unknown as Listing[];

  const isVerified = profile.verification_status === "verified";

  // 30-day staleness check
  const roommateIsStale =
    roommateProfile?.status === "active" && roommateProfile?.updated_at
      ? Date.now() - new Date(roommateProfile.updated_at).getTime() >
        30 * 24 * 60 * 60 * 1000
      : false;

  return (
    <div className="space-y-6 p-4 lg:p-8">
      {/* Header */}
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.full_name}
                width={48}
                height={48}
                className="rounded-full object-cover border-2 border-[#1B4332]/10"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-[#1B4332]/10 flex items-center justify-center">
                <User className="h-6 w-6 text-[#1B4332]" />
              </div>
            )}
            {isVerified && (
              <ShieldCheck className="absolute -bottom-1 -right-1 h-5 w-5 text-[#10B981] bg-white rounded-full" />
            )}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]">
              Student Dashboard
            </p>
            <h1 className="text-xl font-bold text-gray-900">
              Hi, {firstName} 👋
            </h1>
          </div>
        </div>
        <Link
          href="/browse"
          className="flex items-center gap-2 bg-[#1B4332] text-white px-4 py-2 rounded-xl text-sm font-bold hover:brightness-110 transition"
        >
          <Search className="h-4 w-4" />
          Browse
        </Link>
      </header>

      {/* Staleness nudge */}
      {roommateIsStale && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-800">
                Your roommate post is 30+ days old
              </p>
              <p className="text-xs text-amber-600">
                Still looking? Update your profile to stay visible.
              </p>
            </div>
          </div>
          <Link
            href="/student/roommate"
            className="shrink-0 bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-600 transition"
          >
            Update
          </Link>
        </div>
      )}

      {/* Quick-action grid */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          {
            href: "/student/saved",
            icon: Heart,
            label: "Saved",
            sub: `${savedListings.length > 0 ? savedListings.length : "0"} lodges`,
            accent: "#F59E0B",
          },
          {
            href: "/student/roommate",
            icon: Users,
            label: "Roommate",
            sub: roommateProfile ? roommateProfile.status : "No profile",
            accent: "#1B4332",
          },
          {
            href: "/student/profile",
            icon: User,
            label: "Profile",
            sub: isVerified ? "Verified" : "Unverified",
            accent: "#1B4332",
          },
          {
            href: "/browse",
            icon: Search,
            label: "Browse",
            sub: "Find a lodge",
            accent: "#1B4332",
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col items-center justify-center gap-2 hover:border-[#F59E0B] hover:shadow-md transition"
            >
              <div
                className="p-3 rounded-full"
                style={{
                  backgroundColor: `${card.accent}15`,
                  color: card.accent,
                }}
              >
                <Icon className="h-6 w-6" />
              </div>
              <span className="text-sm font-bold text-gray-900">
                {card.label}
              </span>
              <span className="text-[11px] text-gray-500 capitalize">
                {card.sub}
              </span>
            </Link>
          );
        })}
      </section>

      {/* Roommate profile status */}
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-4 w-4 text-[#1B4332]" /> Roommate Profile
          </h2>
          {roommateProfile && (
            <Link
              href="/student/roommate"
              className="text-sm font-semibold text-[#1B4332]"
            >
              Manage →
            </Link>
          )}
        </div>

        {!roommateProfile ? (
          <div className="text-center py-6">
            <div className="h-12 w-12 bg-[#1B4332]/5 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-[#1B4332]/40" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">
              No roommate profile yet
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Post your profile to find a perfect match.
            </p>
            <Link
              href="/roommates/create"
              className="inline-flex items-center gap-2 bg-[#1B4332] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:brightness-110 transition"
            >
              Create Profile <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full capitalize ${
                  roommateProfile.status === "active"
                    ? "bg-emerald-100 text-emerald-700"
                    : roommateProfile.status === "found"
                      ? "bg-gray-100 text-gray-500"
                      : "bg-amber-100 text-amber-700"
                }`}
              >
                {roommateProfile.status === "active" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                )}
                {roommateProfile.status === "found" && (
                  <CheckCircle2 className="h-3 w-3" />
                )}
                {roommateProfile.status}
              </span>
              <p className="text-xs text-gray-500 mt-1">
                {roommateProfile.intent === "have_room"
                  ? "Has a room"
                  : "Looking to team up"}{" "}
                · {roommateProfile.university}
              </p>
            </div>
            {roommateProfile.status === "active" && (
              <Link
                href="/student/roommate"
                className="text-xs font-bold text-[#10B981] bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition"
              >
                Mark Found ✓
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Saved Listings preview */}
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Heart className="h-4 w-4 text-[#F59E0B]" /> Saved Lodges
          </h2>
          <Link
            href="/student/saved"
            className="text-sm font-semibold text-[#1B4332]"
          >
            View all →
          </Link>
        </div>

        {savedListings.length === 0 ? (
          <div className="text-center py-6">
            <Heart className="h-8 w-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              No saved lodges yet. Browse and heart the ones you like.
            </p>
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 mt-4 text-sm font-bold text-[#1B4332] hover:underline"
            >
              Browse Listings <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {savedListings.map((listing: any) => (
              <Link
                key={listing.id}
                href={`/listing/${listing.id}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-[#F59E0B]/50 hover:shadow-sm transition"
              >
                <div className="h-14 w-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  {listing.photos?.[0] && (
                    <img
                      src={listing.photos[0]}
                      alt={listing.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {listing.title}
                  </p>
                  <p className="text-xs text-gray-500">{listing.area}</p>
                  <p className="text-xs font-bold text-[#1B4332]">
                    ₦{listing.price_yearly?.toLocaleString("en-NG")}/yr
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Reviews Given */}
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Star className="h-4 w-4 text-[#F59E0B]" /> Reviews You've Given
          </h2>
        </div>
        {!reviewsGiven || reviewsGiven.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            You haven&apos;t reviewed any lodges yet.
          </p>
        ) : (
          <div className="space-y-3">
            {reviewsGiven.map((review: any) => (
              <div
                key={review.id}
                className="p-3 rounded-xl bg-gray-50 border border-gray-100"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {(review.listing as any)?.title || "Listing"}
                  </p>
                  <span className="flex items-center gap-1 text-xs font-bold text-[#F59E0B]">
                    <Star className="h-3.5 w-3.5 fill-[#F59E0B]" />{" "}
                    {review.rating}
                  </span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">
                  {review.review_text}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Activity Feed placeholder */}
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
          <BookOpen className="h-4 w-4 text-[#1B4332]" /> Activity
        </h2>
        <p className="text-sm text-gray-500 text-center py-4">
          Your profile activity will appear here once your roommate post gets
          views.
        </p>
      </section>
    </div>
  );
}
