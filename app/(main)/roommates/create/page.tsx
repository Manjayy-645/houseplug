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

interface CreateRoommatePageProps {
  searchParams?: { [key: string]: string | string[] | undefined }
}

export default async function CreateRoommatePage({ searchParams }: CreateRoommatePageProps) {
  const supabase = createClient()

  // 1. Must be logged in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const query = new URLSearchParams()
    if (searchParams) {
      Object.entries(searchParams).forEach(([k, v]) => {
        if (typeof v === "string") query.set(k, v)
      })
    }
    const queryString = query.toString()
    const returnPath = queryString ? `/roommates/create?${queryString}` : "/roommates/create"
    redirect(`/login?next=${encodeURIComponent(returnPath)}`)
  }

  // 2. Must be a student
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "student") {
    redirect("/roommates?error=students_only")
  }

  const initialParams = {
    intent: typeof searchParams?.intent === "string" ? searchParams.intent : undefined,
    university: typeof searchParams?.university === "string" ? searchParams.university : undefined,
    budget: typeof searchParams?.budget === "string" ? searchParams.budget : undefined,
    address: typeof searchParams?.address === "string" ? searchParams.address : undefined,
    listing_id: typeof searchParams?.listing_id === "string" ? searchParams.listing_id : undefined,
    listing_title: typeof searchParams?.listing_title === "string" ? searchParams.listing_title : undefined,
  }

  return <CreateRoommateForm initialParams={initialParams} />
}
