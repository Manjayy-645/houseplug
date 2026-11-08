import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { AlertCircle, Clock, Send, ShieldAlert, ArrowLeft } from "lucide-react"
import { submitAppeal } from "./actions"

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
  title: "Submit an Appeal | HousePlug",
}

export default async function AppealPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase.from("profiles").select("banned").eq("id", user.id).single()
  
  if (!profile?.banned) {
    redirect("/")
  }

  // Get active ban
  const { data: ban } = await supabase
    .from("bans")
    .select("id, reason")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("banned_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!ban) {
    // Should not happen if they are banned, but just in case
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <p>No active ban found.</p>
        </div>
      </div>
    )
  }

  // Check for existing appeals for this ban
  const { data: appeals } = await supabase
    .from("appeals")
    .select("status, appeal_message, created_at")
    .eq("ban_id", ban.id)
    .order("created_at", { ascending: false })
    .limit(1)

  const latestAppeal = appeals?.[0]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <Link href="/banned" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium mb-8 self-start max-w-lg mx-auto w-full">
        <ArrowLeft className="w-4 h-4" /> Back to suspension details
      </Link>

      <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appeal Suspension</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Submit an appeal if you believe your account was suspended by mistake.
          </p>
        </div>

        {latestAppeal?.status === 'pending' ? (
          <div className="bg-amber-50 rounded-xl p-6 border border-amber-200 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-amber-900 text-lg">Your appeal is under review</h3>
              <p className="text-sm text-amber-700 mt-2">
                We have received your appeal and our team is currently reviewing it. We will notify you via email once a decision is made.
              </p>
            </div>
            <div className="bg-white/60 p-4 rounded-lg text-left mt-4 border border-amber-100/50">
              <p className="text-xs font-bold text-amber-900/60 uppercase tracking-wider mb-2">Your Message</p>
              <p className="text-sm text-amber-900 whitespace-pre-wrap">{latestAppeal.appeal_message}</p>
            </div>
          </div>
        ) : latestAppeal?.status === 'rejected' ? (
          <div className="bg-red-50 rounded-xl p-6 border border-red-200 text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-red-900 text-lg">Your appeal was rejected</h3>
              <p className="text-sm text-red-700 mt-2">
                After careful review, we have decided to uphold the suspension. If you need further clarification, please contact support.
              </p>
            </div>
          </div>
        ) : (
          <form action={submitAppeal} className="space-y-4">
            <input type="hidden" name="ban_id" value={ban.id} />
            <div className="space-y-2">
              <label htmlFor="appeal_message" className="block text-sm font-bold text-gray-700">
                Explain your situation
              </label>
              <textarea
                id="appeal_message"
                name="appeal_message"
                rows={5}
                required
                placeholder="Please explain why you believe your account should be restored..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B4332] outline-none text-sm resize-none"
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full bg-[#1B4332] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#2D5A47] transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> Submit Appeal
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
