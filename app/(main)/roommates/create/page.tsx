// Server Component — enforces auth + student role before rendering the form
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import CreateRoommateForm from "./create-form"

export const metadata = {
  title: "Create Roommate Profile | HousePlug",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function CreateRoommatePage() {
  const supabase = createClient()

  // 1. Must be logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/roommates/create")

  // 2. Must be a student
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "student") {
    redirect("/roommates?error=students_only")
  }

  return <CreateRoommateForm />
}
