import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"

export default async function LandlordRedirectPage({ params }: { params: { username: string } }) {
  const supabase = createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', params.username)
    .single()

  if (!profile) {
    notFound()
  }

  redirect(`/browse?landlord_id=${profile.id}`)
}
