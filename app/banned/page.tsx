import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { AlertOctagon, ShieldAlert } from "lucide-react"

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
  title: "Account Suspended | HousePlug",
}

export default async function BannedPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("banned").eq("id", user.id).single()
  
  if (!profile?.banned) {
    redirect("/")
  }

  // Get latest active ban
  const { data: ban } = await supabase
    .from("bans")
    .select("reason, created_at")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("banned_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertOctagon className="w-8 h-8 text-red-600" />
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Suspended</h1>
          <p className="text-gray-500 mt-2">Your HousePlug account has been suspended for violating our platform policies.</p>
        </div>

        {ban?.reason && (
          <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-left">
            <h3 className="text-xs font-bold text-red-800 uppercase tracking-wider mb-1 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Reason for suspension
            </h3>
            <p className="text-sm text-red-700">{ban.reason}</p>
          </div>
        )}

        <div className="pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-600 mb-4">
            If you believe this is a mistake, you can submit an appeal for our team to review your case.
          </p>
          <Link
            href="/appeal"
            className="block w-full bg-[#1B4332] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#2D5A47] transition-colors"
          >
            Submit an Appeal
          </Link>
          <form action="/api/auth/signout" method="POST" className="mt-4">
            <button className="text-sm text-gray-500 hover:text-gray-700 font-medium">
              Log out
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
