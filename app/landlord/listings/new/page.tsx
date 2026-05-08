import { ListingForm } from "@/components/landlord/listing-form"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function NewListingPage() {
  const supabase = createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const [{ data: subscription }, { count }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("plan, active, expires_at")
      .eq("landlord_id", user.id)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("landlord_id", user.id)
      .in("status", ["active", "pending"])
  ])

  const now = Date.now()
  const activePlan = (subscription?.active && subscription.expires_at && new Date(subscription.expires_at).getTime() > now)
    ? subscription.plan
    : "free"

  const limits = {
    free: 1,
    pro: 5,
    business: 1000
  }

  const currentLimit = limits[activePlan as keyof typeof limits] || 1
  const isLimitReached = (count ?? 0) >= currentLimit

  if (isLimitReached) {
    const nextTier = activePlan === "free" ? "Pro" : activePlan === "pro" ? "Business" : null
    
    return (
      <div className="p-4 lg:p-8">
        <div className="max-w-2xl rounded-xl border border-amber-300 bg-amber-50 p-6">
          <h1 className="text-xl font-semibold text-amber-900">Listing limit reached</h1>
          <p className="mt-2 text-sm text-amber-800">
            {activePlan === "business" 
              ? "You have reached the maximum number of listings allowed for your account."
              : `Your ${activePlan} plan allows up to ${currentLimit} active ${currentLimit === 1 ? 'listing' : 'listings'}. ${nextTier ? `Upgrade to ${nextTier} to add more.` : ''}`
            }
          </p>
          {nextTier && (
            <Link 
              href="/landlord/subscription" 
              className="mt-4 inline-block rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition"
            >
              View Plans
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Add New Listing</h1>
      <ListingForm mode="create" landlordId={user.id} isPro={activePlan !== "free"} />
    </div>
  )
}

