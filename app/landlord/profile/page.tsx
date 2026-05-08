import { createClient } from "@/lib/supabase/server"
import { User, Mail, Phone, Calendar, Shield } from "lucide-react"
import { formatDate } from "@/lib/utils"

export default async function LandlordProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id)
    .single()

  return (
    <div className="p-6 lg:p-10">
      <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
      <p className="mt-1 text-sm text-gray-500">Manage your personal information.</p>

      <div className="mt-8 max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="bg-[#1B4332] h-32" />
        <div className="px-8 pb-8">
          <div className="-mt-12 flex items-end gap-6">
            <div className="h-24 w-24 rounded-2xl bg-white p-1 shadow-lg">
              <div className="h-full w-full rounded-xl bg-gray-100 flex items-center justify-center">
                <User className="h-12 w-12 text-gray-400" />
              </div>
            </div>
            <div className="mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{profile?.full_name}</h2>
              <p className="text-sm text-gray-500 capitalize">{profile?.role}</p>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <Mail className="h-3 w-3" /> Email Address
              </label>
              <p className="text-sm font-medium text-gray-900">{profile?.email}</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <Phone className="h-3 w-3" /> Phone Number
              </label>
              <p className="text-sm font-medium text-gray-900">{profile?.phone || "Not provided"}</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <Calendar className="h-3 w-3" /> Joined Date
              </label>
              <p className="text-sm font-medium text-gray-900">{formatDate(profile?.created_at)}</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <Shield className="h-3 w-3" /> Account Status
              </label>
              <p className="text-sm font-medium text-green-600">Verified Landlord</p>
            </div>
          </div>

          <div className="mt-10 border-t border-gray-100 pt-8">
             <button className="rounded-lg bg-[#1B4332] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2D5A47]">
                Edit Profile
             </button>
          </div>
        </div>
      </div>
    </div>
  )
}
