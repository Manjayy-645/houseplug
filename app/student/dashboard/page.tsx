import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import {
  Heart,
  Users,
  Star,
  ShieldCheck,
  ArrowRight,
  Search,
  CheckCircle2,
  Clock,
  User,
  ShieldAlert,
  Sparkles,
  Building2,
} from "lucide-react"
import type { Listing } from "@/types"

export const dynamic = "force-dynamic"

export default async function StudentDashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const [
    { data: profile },
    { data: savedData },
    { data: roommateProfile },
    { data: reviewsGiven },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("saved_listings")
      .select("listing_id, listing:listings(*, landlord:profiles(full_name, verification_status, role))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(4),
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
  ])

  if (!profile) redirect("/login")

  const firstName = profile.full_name?.split(" ")[0] ?? "Student"
  const savedListings = (savedData?.map(item => ({
    ...(item.listing as any),
    is_saved: true,
  })) ?? []) as unknown as Listing[]

  const isVerified = profile.verification_status === "verified"

  // 30-day staleness check
  const roommateIsStale = roommateProfile?.status === "active" && roommateProfile?.updated_at
    ? (Date.now() - new Date(roommateProfile.updated_at).getTime()) > 30 * 24 * 60 * 60 * 1000
    : false

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.full_name || "Student"}
                width={52}
                height={52}
                className="rounded-full object-cover border-2 border-[#1B4332]/10"
              />
            ) : (
              <div className="h-13 w-13 rounded-full bg-[#1B4332]/10 flex items-center justify-center">
                <User className="h-7 w-7 text-[#1B4332]" />
              </div>
            )}
            {isVerified && (
              <span title="Verified Student ID" className="absolute -bottom-1 -right-1">
                <ShieldCheck className="h-5 w-5 text-[#10B981] bg-white rounded-full shadow-2xs" />
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#1B4332] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Student Account
              </span>
              {isVerified && (
                <span className="text-[10px] font-bold text-[#10B981]">ID Verified</span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">Welcome back, {firstName}!</h1>
            <p className="text-xs text-gray-500">Find verified student housing near your campus gate.</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/browse"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-[#1B4332] text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-[#153427] active:scale-95 transition-all shadow-xs"
          >
            <Search className="h-4 w-4" />
            <span>Explore Rooms</span>
          </Link>
        </div>
      </header>

      {/* Safety Notice Banner */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#1B4332] text-white shrink-0">
            <ShieldCheck className="h-4 w-4 text-[#F59E0B]" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#1B4332]">Direct WhatsApp Contact &amp; Student Safety</p>
            <p className="text-[11px] text-gray-600">
              Always inspect off-campus lodges physically before making any deposit or rental payment.
            </p>
          </div>
        </div>
        <Link
          href="/safety"
          className="shrink-0 text-xs font-bold text-[#1B4332] hover:underline hidden sm:inline"
        >
          Safety Guide &rarr;
        </Link>
      </div>

      {/* Staleness nudge */}
      {roommateIsStale && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-bold text-amber-900">Your roommate post is over 30 days old</p>
              <p className="text-[11px] text-amber-700">Still looking? Refresh your post to remain top of campus search.</p>
            </div>
          </div>
          <Link
            href="/student/roommate"
            className="shrink-0 bg-amber-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold hover:bg-amber-600 active:scale-95 transition-all"
          >
            Update Post
          </Link>
        </div>
      )}

      {/* Primary Action Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            href: "/browse",
            icon: Search,
            label: "Explore Rooms",
            sub: "UniPort, RSU, IAUE",
            color: "text-[#1B4332]",
            bg: "bg-emerald-50/80 border-emerald-100",
          },
          {
            href: "/student/saved",
            icon: Heart,
            label: "Saved Rooms",
            sub: `${savedListings.length} lodge${savedListings.length === 1 ? "" : "s"} bookmarked`,
            color: "text-rose-600",
            bg: "bg-rose-50/70 border-rose-100",
          },
          {
            href: "/student/roommate",
            icon: Users,
            label: "Roommates",
            sub: roommateProfile ? `${roommateProfile.status}` : "Create Profile",
            color: "text-blue-600",
            bg: "bg-blue-50/70 border-blue-100",
          },
          {
            href: "/student/profile",
            icon: User,
            label: "Profile & Settings",
            sub: isVerified ? "ID Checked" : "Update Profile",
            color: "text-purple-600",
            bg: "bg-purple-50/70 border-purple-100",
          },
        ].map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.href}
              href={card.href}
              className={`rounded-2xl border ${card.bg} p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all active:scale-[0.98] flex flex-col justify-between`}
            >
              <div className={`p-2.5 rounded-xl bg-white w-fit shadow-2xs mb-3 ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <span className="text-sm font-extrabold text-gray-900 block">{card.label}</span>
                <span className="text-[11px] text-gray-500 capitalize block mt-0.5">{card.sub}</span>
              </div>
            </Link>
          )
        })}
      </section>

      {/* Main Accommodation Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Saved Rooms Preview */}
        <section className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <Heart className="h-4 w-4 text-[#F59E0B]" />
              <span>Saved Lodges</span>
            </h2>
            <Link href="/student/saved" className="text-xs font-bold text-[#1B4332] hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {savedListings.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-xl bg-gray-50/60 border border-dashed border-gray-200">
              <Heart className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-700">No saved lodges yet</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-4">
                Bookmark lodges near campus so you can easily review terms and contact agents directly.
              </p>
              <Link
                href="/browse"
                className="inline-flex items-center gap-2 bg-[#1B4332] text-white px-4 py-2 rounded-xl text-xs font-bold hover:brightness-110 transition"
              >
                <span>Browse Student Accommodation</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {savedListings.map((listing: any) => (
                <Link
                  key={listing.id}
                  href={`/listing/${listing.id}`}
                  className="group flex gap-3 p-3 rounded-xl border border-gray-100 hover:border-[#F59E0B]/50 hover:shadow-xs transition bg-white"
                >
                  <div className="h-16 w-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 relative">
                    {listing.photos?.[0] ? (
                      <img 
                        src={listing.photos[0]} 
                        alt={listing.title} 
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform" 
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-300">
                        <Building2 className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-900 truncate group-hover:text-[#1B4332] transition-colors">
                        {listing.title}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">
                        {listing.area} · {listing.distance_from_gate} mins to gate
                      </p>
                    </div>
                    <p className="text-xs font-black text-[#1B4332]">
                      ₦{listing.price_yearly?.toLocaleString("en-NG")}
                      <span className="text-[10px] font-normal text-gray-500">/yr</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Right Col: Roommate Status & Reviews */}
        <div className="space-y-6">
          
          {/* Roommate Profile Card */}
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h2 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-[#1B4332]" />
                <span>Roommate Post</span>
              </h2>
              {roommateProfile && (
                <Link href="/student/roommate" className="text-xs font-bold text-[#1B4332] hover:underline">
                  Edit
                </Link>
              )}
            </div>

            {!roommateProfile ? (
              <div className="text-center py-4">
                <p className="text-xs text-gray-600 mb-3">
                  Find a student to share rent or fill an empty room in your lodge.
                </p>
                <Link
                  href="/roommates/create"
                  className="inline-flex items-center gap-1.5 bg-[#1B4332] text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:brightness-110 transition"
                >
                  <span>Post Roommate Request</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-gray-50/70 border border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      roommateProfile.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : roommateProfile.status === "found"
                        ? "bg-gray-100 text-gray-600"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {roommateProfile.status}
                  </span>
                  <Link 
                    href="/student/roommate" 
                    className="text-[11px] font-bold text-[#1B4332] hover:underline"
                  >
                    Manage
                  </Link>
                </div>
                <p className="text-xs font-bold text-gray-800 truncate">
                  {roommateProfile.intent === "have_room" ? "Has a room to share" : "Looking to team up for a room"}
                </p>
                <p className="text-[10px] text-gray-500">
                  Campus: {roommateProfile.university} · Budget: ₦{Number(roommateProfile.budget_max || 0).toLocaleString("en-NG")}
                </p>
              </div>
            )}
          </section>

          {/* Reviews Given */}
          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-2xs space-y-3">
            <h2 className="text-sm font-extrabold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
              <Star className="h-4 w-4 text-[#F59E0B]" />
              <span>Reviews You've Given</span>
            </h2>

            {!reviewsGiven || reviewsGiven.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-3">
                No lodge reviews yet. Leave reviews on properties you've visited to help fellow students.
              </p>
            ) : (
              <div className="space-y-2.5">
                {reviewsGiven.map((review: any) => (
                  <div key={review.id} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-gray-900 truncate">
                        {(review.listing as any)?.title || "Lodge"}
                      </span>
                      <span className="flex items-center gap-1 font-bold text-[#F59E0B]">
                        <Star className="h-3 w-3 fill-[#F59E0B]" />
                        {review.rating}
                      </span>
                    </div>
                    <p className="text-gray-600 line-clamp-2 text-[11px]">{review.review_text}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  )
}
