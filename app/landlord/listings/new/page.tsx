import { ListingForm } from "@/components/landlord/listing-form"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getLandlordSubscription, getListingLimit } from "@/lib/billing"

export default async function NewListingPage() {
  const supabase = createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const [{ data: profile }, subscription] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single(),
    getLandlordSubscription(user.id)
  ])
  
  const isAdmin = profile?.role === "admin"
  const limit = isAdmin ? Infinity : await getListingLimit(subscription.plan)
  
  const { count } = await supabase
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("landlord_id", user.id)
    .eq("status", "active")

  const activeCount = count ?? 0

  if (activeCount >= limit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
        <div className="text-6xl">🔒</div>
        <h2 className="text-2xl font-bold text-[#111827]">
          Listing limit reached
        </h2>
        <p className="text-gray-600 max-w-md">
          You have {activeCount} active {activeCount === 1 ? 'listing' : 'listings'} 
          on your {subscription.plan} plan 
          {limit !== Infinity ? ` (limit: ${limit})` : ''}.
          {subscription.expired 
            ? ' Your plan has expired — renew to add more listings.'
            : ' Upgrade your plan to add more listings.'
          }
        </p>
        <div className="flex gap-3">
          <Link href="/landlord/dashboard"
             className="border border-gray-300 text-gray-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition">
            Back to Dashboard
          </Link>
          <Link href="/landlord/subscription"
             className="bg-[#F59E0B] text-white px-6 py-3 rounded-lg font-medium hover:brightness-105 transition">
            {subscription.expired ? 'Renew Plan' : 'Upgrade Plan'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Add New Listing</h1>
      <ListingForm mode="create" landlordId={user.id} isPro={isAdmin || (subscription.plan !== "free" && !subscription.expired)} />
    </div>
  )
}
