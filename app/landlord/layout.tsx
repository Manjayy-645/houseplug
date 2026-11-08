import type { Metadata } from "next"
import { redirect } from "next/navigation"
import type { ReactNode } from "react"
import { LandlordSidebar } from "@/components/landlord/sidebar"
import { createClient } from "@/lib/supabase/server"
import type { Plan } from "@/types"

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
  title: "Landlord Dashboard | HousePlug",
}

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
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile || !["landlord", "agent", "admin", "super_admin"].includes(profile.role)) redirect("/")

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

  const now = new Date().toISOString()
  const activePlan = (subscription?.active && subscription.expires_at && subscription.expires_at > now) 
    ? subscription.plan 
    : "free"

  const plan: Plan = activePlan as Plan

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 lg:flex">
      <LandlordSidebar 
        plan={plan} 
        listingCount={count ?? 0} 
        verificationStatus={profile.role === "admin" ? "verified" : (profile.verification_status || 'unverified')}
      />
      <main className="flex-1 pb-24 lg:pb-0">{children}</main>
    </div>
  )
}

