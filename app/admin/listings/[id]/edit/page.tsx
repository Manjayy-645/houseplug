import { notFound, redirect } from "next/navigation"
import { ListingForm } from "@/components/landlord/listing-form"
import { createClient } from "@/lib/supabase/server"
import type { Listing } from "@/types"

type EditListingPageProps = {
  params: { id: string }
}

export default async function AdminEditListingPage({ params }: EditListingPageProps) {
  const supabase = createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin" && profile?.role !== "super_admin") {
    redirect("/login")
  }

  const { data: listingData } = await supabase
    .from("listings")
    .select("*")
    .eq("id", params.id)
    .single()

  if (!listingData) notFound()

  // Find if landlord is pro
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, active, expires_at")
    .eq("landlord_id", listingData.landlord_id)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: landlordProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", listingData.landlord_id)
    .single()

  const now = Date.now()
  const isPro =
    subscription?.plan === "pro" &&
    subscription.expires_at &&
    new Date(subscription.expires_at).getTime() > now

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Edit Listing</h1>
        <p className="text-sm text-gray-500">You are editing this listing as an administrator.</p>
      </div>
      <ListingForm mode="edit" listing={listingData as Listing} landlordId={listingData.landlord_id} isPro={!!isPro} isAgent={landlordProfile?.role === "agent"} />
    </div>
  )
}
