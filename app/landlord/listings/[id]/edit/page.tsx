import { notFound } from "next/navigation"
import { ListingForm } from "@/components/landlord/listing-form"
import { createClient } from "@/lib/supabase/server"
import type { Listing } from "@/types"

type EditListingPageProps = {
  params: { id: string }
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  const supabase = createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) notFound()

  const [{ data: listingData }, { data: subscription }] = await Promise.all([
    supabase
      .from("listings")
      .select("*")
      .eq("id", params.id)
      .eq("landlord_id", user.id)
      .single(),
    supabase
      .from("subscriptions")
      .select("plan, active, expires_at")
      .eq("landlord_id", user.id)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  ])

  if (!listingData) notFound()

  const now = Date.now()
  const isPro =
    subscription?.plan === "pro" &&
    subscription.expires_at &&
    new Date(subscription.expires_at).getTime() > now

  return (
    <div className="p-4 lg:p-8">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Edit Listing</h1>
      <ListingForm mode="edit" listing={listingData as Listing} landlordId={user.id} isPro={isPro} />
    </div>
  )
}

