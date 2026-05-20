import { createClient } from "@/lib/supabase/server"
import { User, Mail, Phone, Calendar, Shield, Share, ShieldCheck } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { MarketingCardPreview } from "@/components/landlord/marketing-card-preview"

export default async function LandlordProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // Auto-generate username if null
  if (profile && !profile.username) {
    const { data: generatedUsername } = await supabase.rpc('generate_username', { full_name: profile.full_name })
    if (generatedUsername) {
      await supabase.from('profiles').update({ username: generatedUsername }).eq('id', user.id)
      profile.username = generatedUsername
    }
  }

  // Fetch stats for marketing card
  const [
    { data: activeListings, count: activeCount },
    { data: reviews }
  ] = await Promise.all([
    supabase
      .from('listings')
      .select('university, area', { count: 'exact' })
      .eq('landlord_id', user.id)
      .eq('status', 'active'),
    supabase
      .from('reviews')
      .select('rating, listing:listings!inner(landlord_id)')
      .eq('listing.landlord_id', user.id)
  ])

  const listings = activeListings || []
  const primaryArea = listings.length > 0 ? listings[listings.length - 1].area : 'Port Harcourt'
  const universities = Array.from(new Set(listings.map(l => l.university).filter(Boolean)))
  
  let avgRating = 0
  let reviewCount = 0
  if (reviews && reviews.length > 0) {
    reviewCount = reviews.length
    avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
  }

  return (
    <div className="p-6 lg:p-10 space-y-12">
      {/* Marketing Card Section */}
      <section>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Shareable Card</h1>
          <p className="mt-1 text-sm text-gray-500">Share this card in WhatsApp groups to attract students to your listings</p>
        </div>
        
        <div className="mt-8">
          <MarketingCardPreview 
            profile={profile} 
            activeListingsCount={activeCount || 0}
            avgRating={avgRating}
            reviewCount={reviewCount}
            universities={universities}
            primaryArea={primaryArea}
          />
        </div>
      </section>

      {/* Profile Info Section */}
      <section>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
          <p className="mt-1 text-sm text-gray-500">Manage your personal information.</p>
        </div>

        <div className="mt-8 max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="bg-[#1B4332] h-32" />
          <div className="px-8 pb-8">
            <div className="-mt-12 flex items-end gap-6">
              <div className="h-24 w-24 rounded-2xl bg-white p-1 shadow-lg">
                <div className="h-full w-full rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? (
                     <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                     <User className="h-12 w-12 text-gray-400" />
                  )}
                </div>
              </div>
              <div className="mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{profile?.full_name}</h2>
                <p className="text-sm text-gray-500 capitalize">{profile?.role}</p>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <Mail className="h-3 w-3" /> Email Address
                </label>
                <p className="text-sm font-medium text-gray-900">{profile?.email}</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <Phone className="h-3 w-3" /> Phone Number
                </label>
                <p className="text-sm font-medium text-gray-900">{profile?.phone || "Not provided"}</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <Calendar className="h-3 w-3" /> Joined Date
                </label>
                <p className="text-sm font-medium text-gray-900">{formatDate(profile?.created_at)}</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <Shield className="h-3 w-3" /> Account Status
                </label>
                {profile?.verification_status === 'verified' ? (
                   <p className="text-sm font-medium text-green-600 flex items-center gap-1">
                     <ShieldCheck className="h-4 w-4" /> Verified Landlord
                   </p>
                ) : (
                   <p className="text-sm font-medium text-gray-500 capitalize">{profile?.verification_status || 'Unverified'}</p>
                )}
              </div>
            </div>

            <div className="mt-10 border-t border-gray-100 pt-8">
               <button className="rounded-lg bg-[#1B4332] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2D5A47]">
                  Edit Profile
               </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
