import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { UniversityDemandTable } from "@/components/admin/UniversityDemandTable"

export const metadata = {
  title: "Campus Expansion Demand | HousePlug Admin",
}

export default async function UniversityRequestsAdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!["admin", "super_admin"].includes(profile?.role || "")) {
    redirect("/admin")
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <UniversityDemandTable />
    </div>
  )
}
