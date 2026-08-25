import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BadgeCheck, User, Home, MapPin, Sparkles, ShieldCheck, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { RoommateContactButton } from "./contact-button"
import { ShareButton } from "./share-button"

export const metadata = {
  title: "Roommate Profile | HousePlug",
  description: "View roommate profile on HousePlug.",
}

export default async function RoommateProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  const currentUserId = session?.user?.id

  // Fetch current user's role (only if logged in)
  let currentUserRole: string | null = null
  if (currentUserId) {
    const { data: currentUserProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUserId)
      .single()
    currentUserRole = currentUserProfile?.role ?? null
  }

  // Fetch roommate profile
  const { data: roommate } = await supabase
    .from("roommate_profiles")
    .select("*")
    .eq("id", params.id)
    .single()

  if (!roommate) {
    notFound()
  }

  // Fetch user profile
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, verification_status")
    .eq("id", roommate.user_id)
    .single()

  const data = {
    ...roommate,
    profile: userProfile || { full_name: "Student", avatar_url: null, verification_status: "unverified" }
  }

  const isGuest = !currentUserId

  const isVerified = data.profile.verification_status === "verified"

  return (
    <main className="min-h-screen bg-[#F9FAFB] pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <Link href="/roommates" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 font-semibold transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to listings
          </Link>
          <ShareButton url={`https://houseplug.ng/roommates/${params.id}`} />
        </div>
        
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className={`px-6 py-4 flex items-center justify-between text-white ${data.intent === 'have_room' ? 'bg-[#F59E0B]' : 'bg-[#1B4332]'}`}>
            <span className="flex items-center gap-2 text-sm font-black uppercase tracking-wider">
              {data.intent === 'have_room' ? (
                <><Home className="h-5 w-5" /> Has a Room</>
              ) : (
                <><User className="h-5 w-5" /> Looking to Team Up</>
              )}
            </span>
          </div>

          <div className="p-8 space-y-8">
            {/* Profile Main Info */}
            <div className="flex items-center gap-5 border-b border-gray-100 pb-6">
              <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-[#1B4332]/10 bg-gray-50 shrink-0">
                {data.profile.avatar_url ? (
                  <img src={data.profile.avatar_url} alt={data.profile.full_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400">
                    <User className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="font-bold text-2xl text-gray-900 flex items-center gap-2">
                  {data.profile.full_name || "Student"}
                  {isVerified && <BadgeCheck className="h-6 w-6 text-emerald-500" />}
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
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Budget / Rent Share</p>
                <p className="font-black text-[#1B4332] text-xl">
                  ₦{data.budget_min.toLocaleString()} - ₦{data.budget_max.toLocaleString()}
                  <span className="text-sm text-gray-500 font-normal">/yr</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Preferred Roommate</p>
                <p className="font-bold text-gray-800 text-base capitalize">
                  {data.preferred_gender === "any" ? "Any Gender" : `${data.preferred_gender} Only`}
                </p>
              </div>
            </div>

            {/* Room Location (If Has Room) */}
            {data.intent === "have_room" && data.room_address && (
              <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-100">
                <p className="text-xs text-amber-800 font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <MapPin className="h-4 w-4 text-amber-600" /> Room Address / Location
                </p>
                <p className="text-base font-semibold text-gray-800">{data.room_address}</p>
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
                  <span key={i} className="px-4 py-2 rounded-xl bg-gray-100 text-sm font-semibold text-gray-700">
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
              <RoommateContactButton 
                phoneNumber={data.phone_number} 
                firstName={data.profile.full_name?.split(" ")[0] || "there"} 
                currentUserRole={currentUserRole}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
