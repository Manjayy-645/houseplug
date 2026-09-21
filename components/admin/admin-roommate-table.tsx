"use client"

import { useState } from "react"
import { Users, ExternalLink, Pause, Play, Trash2, Eye, ChevronDown, ChevronUp } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface RoommateRow {
  id: string
  user_id: string
  intent: string
  university: string
  budget_min: number
  budget_max: number
  gender: string
  preferred_gender: string
  lifestyle_tags: string[]
  bio: string
  phone_number: string
  room_photos: string[]
  room_address: string | null
  status: string
  created_at: string
  updated_at: string
  profile: {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
    verification_status: string
  } | null
}

export function AdminRoommateTable({ roommates }: { roommates: RoommateRow[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  async function handleStatusChange(id: string, newStatus: string) {
    setLoading(id)
    const supabase = createClient()
    const { error } = await supabase
      .from("roommate_profiles")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      alert("Failed to update status: " + error.message)
    }
    setLoading(null)
    router.refresh()
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to permanently delete ${name}'s roommate profile? This cannot be undone.`)) return
    setLoading(id)
    const supabase = createClient()
    const { error } = await supabase
      .from("roommate_profiles")
      .delete()
      .eq("id", id)

    if (error) {
      alert("Failed to delete: " + error.message)
    }
    setLoading(null)
    router.refresh()
  }

  const formatBudget = (n: number) => `₦${n.toLocaleString("en-NG")}`

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-emerald-50 text-emerald-700 border-emerald-200",
      paused: "bg-amber-50 text-amber-700 border-amber-200",
      found: "bg-blue-50 text-blue-700 border-blue-200",
    }
    return (
      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border ${styles[status] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
        {status}
      </span>
    )
  }

  const intentLabel = (intent: string) => {
    return intent === "have_room" ? "Has a Room" : "Teaming Up"
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left">
              <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Student</th>
              <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">University</th>
              <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Intent</th>
              <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Budget</th>
              <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-wider">Created</th>
              <th className="px-4 py-4 text-xs font-black text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {roommates.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-bold text-gray-900">{r.profile?.full_name || "Unknown"}</p>
                    <p className="text-xs text-gray-400">{r.profile?.email || r.user_id.slice(0, 8)}</p>
                  </div>
                </td>
                <td className="px-4 py-4 text-gray-700 font-medium">{r.university}</td>
                <td className="px-4 py-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                    r.intent === "have_room" ? "bg-purple-50 text-purple-700" : "bg-teal-50 text-teal-700"
                  }`}>
                    {intentLabel(r.intent)}
                  </span>
                </td>
                <td className="px-4 py-4 text-gray-700 font-medium whitespace-nowrap">
                  {formatBudget(r.budget_min)} – {formatBudget(r.budget_max)}
                </td>
                <td className="px-4 py-4">{statusBadge(r.status)}</td>
                <td className="px-4 py-4 text-gray-400 text-xs">
                  {new Date(r.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-1">
                    {r.status === "active" ? (
                      <button
                        onClick={() => handleStatusChange(r.id, "paused")}
                        disabled={loading === r.id}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Pause profile"
                      >
                        <Pause className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(r.id, "active")}
                        disabled={loading === r.id}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Activate profile"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(r.id, r.profile?.full_name || "this user")}
                      disabled={loading === r.id}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete profile"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-gray-50">
        {roommates.map((r) => {
          const isExpanded = expandedId === r.id
          return (
            <div key={r.id} className="p-4">
              <button
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#1B4332]/10 flex items-center justify-center text-[#1B4332] font-bold text-sm">
                    {(r.profile?.full_name || "?")[0]}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{r.profile?.full_name || "Unknown"}</p>
                    <p className="text-xs text-gray-400">{r.university}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {statusBadge(r.status)}
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </div>
              </button>

              {isExpanded && (
                <div className="mt-3 ml-13 space-y-3 animate-in fade-in slide-in-from-top-1">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="font-bold text-gray-400 uppercase tracking-wider mb-0.5">Intent</p>
                      <p className="font-medium text-gray-700">{intentLabel(r.intent)}</p>
                    </div>
                    <div>
                      <p className="font-bold text-gray-400 uppercase tracking-wider mb-0.5">Budget</p>
                      <p className="font-medium text-gray-700">{formatBudget(r.budget_min)} – {formatBudget(r.budget_max)}</p>
                    </div>
                    <div>
                      <p className="font-bold text-gray-400 uppercase tracking-wider mb-0.5">Gender</p>
                      <p className="font-medium text-gray-700">{r.gender} / Pref: {r.preferred_gender}</p>
                    </div>
                    <div>
                      <p className="font-bold text-gray-400 uppercase tracking-wider mb-0.5">Phone</p>
                      <p className="font-medium text-gray-700">{r.phone_number}</p>
                    </div>
                  </div>
                  {r.bio && (
                    <p className="text-xs text-gray-500 italic">&ldquo;{r.bio}&rdquo;</p>
                  )}
                  {r.lifestyle_tags && r.lifestyle_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(r.lifestyle_tags) ? r.lifestyle_tags : []).map((tag: string) => (
                        <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    {r.status === "active" ? (
                      <button
                        onClick={() => handleStatusChange(r.id, "paused")}
                        disabled={loading === r.id}
                        className="flex-1 py-2 text-xs font-bold text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition disabled:opacity-50"
                      >
                        Pause
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(r.id, "active")}
                        disabled={loading === r.id}
                        className="flex-1 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition disabled:opacity-50"
                      >
                        Activate
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(r.id, r.profile?.full_name || "this user")}
                      disabled={loading === r.id}
                      className="flex-1 py-2 text-xs font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
