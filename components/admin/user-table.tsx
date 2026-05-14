"use client"

import { useState } from "react"
import { Profile } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { formatDate } from "@/lib/utils"
import { Ban, ShieldCheck, Loader2, User } from "lucide-react"
import { useRouter } from "next/navigation"

interface UserWithCounts extends Profile {
  listings: { count: number }[]
}

export default function UserTable({ users }: { users: UserWithCounts[] }) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleToggleBan = async (id: string, isBanned: boolean) => {
    if (!confirm(`Are you sure you want to ${isBanned ? "unban" : "ban"} this user?`)) return

    setLoading(id)
    const { error } = await supabase
      .from("profiles")
      .update({ banned: !isBanned })
      .eq("id", id)

    if (error) {
      alert(`Failed to ${isBanned ? "unban" : "ban"} user`)
    } else {
      router.refresh()
    }
    setLoading(null)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600">
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Listings</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users?.map((user) => (
              <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${user.banned ? "bg-red-50/30" : ""}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <User className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-900">{user.full_name}</span>
                        {user.role === 'landlord' && user.verification_status === 'verified' && (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" title="Verified Landlord" />
                        )}
                        {user.role === 'landlord' && user.verification_status === 'pending' && (
                          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Verification Pending" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'landlord' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {user.listings?.[0]?.count || 0}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {formatDate(user.created_at)}
                </td>
                <td className="px-6 py-4">
                  {user.banned ? (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Banned</span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleToggleBan(user.id, !!user.banned)}
                    disabled={loading === user.id}
                    className={`p-2 rounded-lg transition-colors ${
                      user.banned 
                        ? "text-green-600 hover:bg-green-50" 
                        : "text-red-600 hover:bg-red-50"
                    } disabled:opacity-50`}
                    title={user.banned ? "Unban User" : "Ban User"}
                  >
                    {loading === user.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : user.banned ? (
                      <ShieldCheck className="w-5 h-5" />
                    ) : (
                      <Ban className="w-5 h-5" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
