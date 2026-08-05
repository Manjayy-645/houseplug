import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ProfileClient } from "./profile-client"

export async function generateMetadata({ params }: { params: { username: string } }) {
  const supabase = createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username')
    .eq('username', params.username)
    .single()

  if (!profile) return { title: 'Profile Not Found' }
  return { title: `${profile.full_name} | HousePlug` }
}

export default async function LandlordProfilePage({ params }: { params: { username: string } }) {
  const supabase = createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', params.username)
    .single()

  if (!profile) {
    notFound()
  }

  // Fetch agent's active listings
  const { data: listings } = await supabase
    .from('listings')
    .select(`
      *,
      landlord:profiles(*)
    `)
    .eq('landlord_id', profile.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  // Note: in a real application, you would also fetch reviews.
  // For now, we mock review counts and average rating since it requires a join with reviews table.
  const reviewsCount = 0
  const averageRating = 5.0
  
  // Calculate years on platform based on created_at
  const createdDate = new Date(profile.created_at)
  const currentDate = new Date()
  let yearsOnPlatform = currentDate.getFullYear() - createdDate.getFullYear()
  if (yearsOnPlatform === 0) yearsOnPlatform = 1 // default to 1yr for new agents

  return (
    <ProfileClient 
      profile={profile} 
      listings={listings || []} 
      reviewsCount={reviewsCount}
      averageRating={averageRating}
      yearsOnPlatform={yearsOnPlatform}
    />
  )
}
