import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ProfileClient } from "./profile-client"
import { BreadcrumbJsonLd, ProfileJsonLd } from "@/components/seo/json-ld"

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  const supabase = createClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username, role, avatar_url")
    .eq("username", params.username)
    .single()

  if (!profile) return { title: "Profile Not Found | HousePlug" }

  const roleLabel = profile.role === "agent" ? "Agent" : "Landlord"
  const title = `${profile.full_name} — Verified ${roleLabel} on HousePlug`
  const description = `View verified student accommodation and lodges managed by ${profile.full_name} on HousePlug. Contact directly via WhatsApp.`
  const canonicalUrl = `https://houseplug.ng/landlord/${params.username}`

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "HousePlug",
      locale: "en_NG",
      type: "profile",
      images: [
        {
          url: profile.avatar_url || "https://houseplug.ng/icons/og-default.jpg",
          width: 1200,
          height: 630,
          alt: `${profile.full_name} HousePlug Profile`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [profile.avatar_url || "https://houseplug.ng/icons/og-default.jpg"],
    },
  }
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

  const reviewsCount = 0
  const averageRating = 5.0
  
  // Calculate years on platform based on created_at
  const createdDate = new Date(profile.created_at)
  const currentDate = new Date()
  let yearsOnPlatform = currentDate.getFullYear() - createdDate.getFullYear()
  if (yearsOnPlatform === 0) yearsOnPlatform = 1

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Browse Housing", url: "/browse" },
          { name: profile.full_name, url: `/landlord/${profile.username}` },
        ]}
      />
      <ProfileJsonLd
        name={profile.full_name}
        username={profile.username}
        role={profile.role}
        image={profile.avatar_url}
        description={`Verified ${profile.role} on HousePlug with ${listings?.length || 0} active student housing listings.`}
      />
      <ProfileClient 
        profile={profile} 
        listings={listings || []} 
        reviewsCount={reviewsCount}
        averageRating={averageRating}
        yearsOnPlatform={yearsOnPlatform}
      />
    </>
  )
}
