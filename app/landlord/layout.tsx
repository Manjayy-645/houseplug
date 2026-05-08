import { redirect } from "next/navigation"
import type { ReactNode } from "react"
import { LandlordSidebar } from "@/components/landlord/sidebar"
import { createClient } from "@/lib/supabase/server"
import type { Plan } from "@/types"

type LandlordLayoutProps = {
  children: ReactNode
}

export default async function LandlordLayout({ children }: LandlordLayoutProps) {
  const supabase = createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single()

  if (!profile || (profile.role !== "landlord" && profile.role !== "admin")) redirect("/")

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
    
  const plan: Plan = activePlan as Plan
  const listingLimit = plan === "business" ? 999 : plan === "pro" ? 5 : 1

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 lg:flex">
      <LandlordSidebar plan={plan} listingCount={count ?? 0} listingLimit={listingLimit} />
      <main className="flex-1">{children}</main>
    </div>
  )
}

