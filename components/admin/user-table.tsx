"use client"

import { useState } from "react"
import { Profile } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { formatDate } from "@/lib/utils"
import { Ban, ShieldCheck, Loader2, User, Crown, Trash2, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"

interface UserWithCounts extends Profile {
  listings: { count: number }[]
}

export default function UserTable({
  users,
  isSuperAdmin = false,
  currentUserId = null,
}: {
  users: UserWithCounts[]
  isSuperAdmin?: boolean
  currentUserId?: string | null
}) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [userToDelete, setUserToDelete] = useState<UserWithCounts | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDeleteUser() {
    if (!userToDelete) return
    setDeleting(true)
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userToDelete.id }),
      })
      const data = await res.json()
      if (data.success) {
        setUserToDelete(null)
        router.refresh()
      } else {
        alert(data.error || "Failed to delete user")
      }
    } catch (err) {
      alert("Something went wrong")
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleBan = async (id: string, isBanned: boolean) => {
    if (!confirm(`Are you sure you want to ${isBanned ? "unban" : "ban"} this user?`)) return

    setLoading(id)
    try {
      const res = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          targetUserId: id, 
          action: isBanned ? 'unban' : 'ban',
          reason: isBanned ? null : 'Violating platform policies'
        })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      router.refresh()
    } catch (error: any) {
      alert(error.message || `Failed to ${isBanned ? "unban" : "ban"} user`)
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
                        {user.role === 'super_admin' && (
                           <span title="Super Admin">
                             <Crown className="w-3.5 h-3.5 text-amber-500" />
                           </span>
                        )}
                        {user.role === 'landlord' && user.verification_status === 'verified' && (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                            <span className="sr-only">Verified Landlord</span>
                          </>
                        )}
                        {user.role === 'landlord' && user.verification_status === 'pending' && (
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
                            <span className="sr-only">Verification Pending</span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-full ${
                    user.role === 'super_admin' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'landlord' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role.replace('_', ' ')}
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
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1">
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

                    {isSuperAdmin && user.role !== "super_admin" && user.id !== currentUserId && (
                      <button
                        onClick={() => setUserToDelete(user)}
                        className="flex items-center gap-1.5 text-red-600 hover:bg-red-50 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {userToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete User</h3>
            </div>

            <p className="text-sm text-gray-600">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold">{userToDelete.full_name}</span>{" "}
              ({userToDelete.email})?
            </p>

            <div className="bg-red-50 rounded-xl p-3">
              <p className="text-xs text-red-700">
                This will permanently delete their account, all their listings, reviews,
                subscriptions, payments, and verification documents. This cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setUserToDelete(null)}
                disabled={deleting}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Permanently"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
