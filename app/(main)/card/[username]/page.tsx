import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ShieldCheck, Star } from "lucide-react"
import { ClientDownloadButton } from "@/components/landlord/client-download-button"

export async function generateMetadata({ params }: { params: { username: string } }) {
  const supabase = createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, verification_status')
    .eq('username', params.username)
    .single()

  if (!profile || profile.role !== 'landlord') return {}
  
  const { count: activeCount } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('landlord_id', (await supabase.from('profiles').select('id').eq('username', params.username).single()).data?.id)
    .eq('status', 'active')

  return {
    title: `${profile.full_name} — Student Rooms on HousePlug`,
    description: `${activeCount || 0} verified student rooms available in Port Harcourt. No agent fees. View listings on HousePlug.`,
    openGraph: {
      title: `${profile.full_name} has rooms on HousePlug`,
      description: `${activeCount || 0} listings available · ${profile.verification_status === 'verified' ? 'Verified landlord' : 'Landlord'} · houseplug.ng`,
      url: `https://houseplug.ng/card/${params.username}`,
      siteName: 'HousePlug',
      type: 'profile',
    },
  }
}

export default async function MarketingCardPage({ params }: { params: { username: string } }) {
  const supabase = createClient()

  // 1. Fetch landlord profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', params.username)
    .single()

  if (!profile || profile.role !== 'landlord') {
    notFound()
  }

  // 2. Fetch stats and active listings in parallel
  const [
    { data: activeListings, count: activeCount },
    { data: reviews }
  ] = await Promise.all([
    supabase
      .from('listings')
      .select('university, area', { count: 'exact' })
      .eq('landlord_id', profile.id)
      .eq('status', 'active'),
    supabase
      .from('reviews')
      .select('rating, listing:listings!inner(landlord_id)')
      .eq('listing.landlord_id', profile.id)
  ])

  // Process data
  const listings = activeListings || []
  const primaryArea = listings.length > 0 ? listings[listings.length - 1].area : 'Port Harcourt'
  const universities = Array.from(new Set(listings.map(l => l.university).filter(Boolean)))
  
  let avgRating = 0
  let reviewCount = 0
  if (reviews && reviews.length > 0) {
    reviewCount = reviews.length
    avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
  }

  const initials = profile.full_name?.substring(0, 2).toUpperCase() || "LL"
  const cardUrl = `https://houseplug.ng/card/${profile.username}`

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      
      {/* Downloadable Card Container */}
      <div className="w-full max-w-[400px] mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden" id="houseplug-card">
        
        {/* Header */}
        <div className="bg-[#1B4332] px-6 py-5 flex items-center justify-between">
          <span className="text-white font-bold text-lg">🏠 HousePlug</span>
          <span className="text-[#F59E0B] text-xs font-bold">houseplug.ng</span>
        </div>

        {/* Body */}
        <div className="px-6 py-6 bg-white space-y-4">
          
          {/* Identity Row */}
          <div className="flex items-center gap-4">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-bold text-xl shrink-0">
                {initials}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-lg font-bold text-[#111827]">{profile.full_name}</span>
              {profile.verification_status === 'verified' && (
                <span className="inline-flex items-center gap-1 text-[#10B981] text-sm font-medium">
                  <ShieldCheck className="w-4 h-4" /> Verified Landlord
                </span>
              )}
              {reviewCount > 0 && (
                <span className="flex items-center gap-1 text-gray-500 text-sm mt-0.5">
                  <Star className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
                  {avgRating.toFixed(1)} &middot; {reviewCount} reviews
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 my-4" />

          {/* Info List */}
          <div className="flex flex-col gap-2">
            <span className="text-sm text-[#374151]">📍 {primaryArea}{primaryArea !== 'Port Harcourt' ? ', Port Harcourt' : ''}</span>
            <span className="text-sm text-[#374151]">
              🏠 {activeCount || 0} Active Listing{activeCount !== 1 ? 's' : ''}
            </span>
            {(activeCount || 0) > 0 && universities.length > 0 && (
              <span className="text-sm text-[#374151]">
                🎓 Near {universities.join(' & ')}
              </span>
            )}
            {(activeCount || 0) > 0 && universities.length === 0 && (
              <span className="text-sm text-[#374151]">🎓 Near Port Harcourt Campus</span>
            )}
          </div>

          <div className="h-4" />

          {/* Link Box */}
          <a 
            href={`https://houseplug.ng/landlord/${profile.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-[#FFFBEB] border-[1.5px] border-[#F59E0B] rounded-xl p-4 cursor-pointer hover:bg-amber-50 transition"
          >
            <p className="text-xs text-[#6B7280] mb-1">View all my listings:</p>
            <p className="text-base font-bold text-[#1B4332] break-all">
              houseplug.ng/landlord/{profile.username}
            </p>
          </a>

          <div className="h-4" />

          {/* Tagline */}
          <p className="text-sm text-[#6B7280] text-center italic">
            "Find verified student housing without agent stress"
          </p>
        </div>

        {/* Footer */}
        <div className="bg-[#F9FAFB] px-6 py-3 border-t border-gray-100 text-center">
          <span className="text-xs text-[#9CA3AF]">Powered by HousePlug &middot; houseplug.ng</span>
        </div>
      </div>

      {/* Buttons Below Card (Not part of download) */}
      <div className="mt-6 w-full max-w-[400px] mx-auto space-y-3">
        <a
          href={`/landlord/${profile.username}`}
          className="flex items-center justify-center w-full bg-[#1B4332] text-white rounded-xl py-3 text-sm font-bold shadow-sm hover:brightness-110 transition active:scale-95"
        >
          🏠 View All Listings
        </a>
        <a
          href={`https://wa.me/${profile.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${profile.full_name}, I saw your card on HousePlug. Are your rooms still available?`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-full bg-[#25D366] text-white rounded-xl py-3 text-sm font-bold shadow-sm hover:brightness-110 transition active:scale-95"
        >
          💬 Contact on WhatsApp
        </a>
        <ClientDownloadButton username={profile.username || 'user'} />
      </div>
    </div>
  )
}

