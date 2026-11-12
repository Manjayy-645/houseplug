import type { Metadata } from "next"
import { createClient, getAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
  title: "Admin Portal | HousePlug",
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const db = getAdminClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch admin profile, pending verification count, and pending services count in parallel
  const [profileRes, pendingRes, pendingServicesRes] = await Promise.all([
    db
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single(),
    db
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .in("role", ["landlord", "agent"])
      .eq("verification_status", "pending"),
    db
      .from("service_providers")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
  ])

  const profile = profileRes.data
  const pendingVerifications = pendingRes.count
  const pendingServices = pendingServicesRes.count

  if (!["admin", "super_admin"].includes(profile?.role || "")) {
    redirect("/")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <AdminSidebar
        role={profile?.role}
        pendingCount={pendingVerifications || 0}
        pendingServicesCount={pendingServices || 0}
      />

      {/* Main content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
