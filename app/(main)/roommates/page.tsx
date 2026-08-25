import Link from "next/link"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { RoommateCard } from "@/components/roommate-card"
import { Search, SlidersHorizontal, Users, ArrowRight, Sparkles } from "lucide-react"

export const metadata = {
  title: "Find a Roommate | HousePlug",
  description: "Connect with verified students across Nigerian universities to find your perfect roommate.",
}


export default async function RoommatesPage() {
  const supabase = createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  const currentUserId = session?.user?.id
  const isGuest = !currentUserId

  // Use service client for guests (bypasses RLS without weakening it)
  const dataClient = isGuest ? createServiceClient() : supabase

  // Fetch current user's role if logged in
  let currentUserRole: string | null = null
  if (currentUserId) {
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", currentUserId)
      .single()
    currentUserRole = userProfile?.role ?? null
  }
  
  // Fetch real profiles — exclude phone_number for guests
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let profiles: any[] = []
  if (isGuest) {
    const { data } = await dataClient
      .from("roommate_profiles")
      .select("id, user_id, intent, university, budget_min, budget_max, gender, preferred_gender, lifestyle_tags, bio, room_photos, room_address, status, created_at, updated_at")
      .eq("status", "active")
      .order("created_at", { ascending: false })
    profiles = data || []
  } else {
    const { data } = await dataClient
      .from("roommate_profiles")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
    profiles = data || []
  }

  // If we have profiles, fetch their corresponding public.profiles data 
  // since there is no direct foreign key from roommate_profiles to public.profiles
  if (profiles.length > 0) {
    const userIds = profiles.map(p => p.user_id)
    const { data: usersProfiles } = await dataClient
      .from("profiles")
      .select("id, full_name, avatar_url, verification_status")
      .in("id", userIds)

    if (usersProfiles) {
      profiles = profiles.map(p => ({
        ...p,
        profile: usersProfiles.find(up => up.id === p.user_id) || null
      }))
    }
  }

  return (
    <main className="min-h-screen bg-[#F9FAFB] pt-24 pb-20">
      {/* Hero Section */}
      <section className="bg-[#1B4332] py-16 px-5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
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
              Find your perfect <span className="text-[#F59E0B]">roommate</span>.
            </h1>
            <p className="text-base md:text-lg text-white/80 mb-8 max-w-xl leading-relaxed">
              Whether you already have a place and need someone to split the rent, or you're looking for a partner to hunt for an apartment together — we've got you covered.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/roommates/create" className="w-full sm:w-auto bg-[#F59E0B] text-white px-8 py-4 rounded-xl font-bold hover:brightness-105 transition shadow-lg shadow-amber-500/20 active:scale-95 inline-block text-center text-lg">
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
                  Create a free student account to contact roommates directly on WhatsApp.
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
      <div className="max-w-7xl mx-auto px-5 py-12">
        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center w-full md:w-auto gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search university or keyword..." 
                className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/20 transition-all outline-none text-sm"
              />
            </div>
            <button className="md:hidden flex shrink-0 items-center justify-center h-12 w-12 bg-gray-50 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors border border-gray-100">
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          </div>
          
          <div className="hidden md:flex items-center gap-3">
            <select className="bg-gray-50 border-transparent rounded-xl px-4 py-3 text-gray-700 font-medium focus:ring-2 focus:ring-[#1B4332]/20 outline-none cursor-pointer">
              <option value="">Any Intent</option>
              <option value="have_room">Has a Room</option>
              <option value="teaming_up">Looking to Team Up</option>
            </select>
            <select className="bg-gray-50 border-transparent rounded-xl px-4 py-3 text-gray-700 font-medium focus:ring-2 focus:ring-[#1B4332]/20 outline-none cursor-pointer">
              <option value="">Any Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <button className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 rounded-xl px-5 py-3 text-gray-700 font-bold transition-colors">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {profiles.map((profile: any) => (
            <RoommateCard key={profile.id} data={profile} currentUserId={currentUserId} currentUserRole={currentUserRole} />
          ))}
        </div>
      </div>
    </main>
  )
}
