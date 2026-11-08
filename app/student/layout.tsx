import type { Metadata } from "next"
import { redirect } from "next/navigation"
import type { ReactNode } from "react"
import { createClient } from "@/lib/supabase/server"
import { StudentNav } from "@/components/student/student-nav"

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
  title: "Student Dashboard | HousePlug",
}

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/login")

  // Non-students go to their own dashboard
  if (profile.role === "landlord" || profile.role === "agent") redirect("/landlord/dashboard")
  if (profile.role === "admin" || profile.role === "super_admin") redirect("/admin/listings")

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900">
      <StudentNav />
      <main className="pb-24">{children}</main>
    </div>
  )
}
