"use client"

import { useState, useEffect, useCallback } from "react"
import { Profile } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { formatDate, formatNaira } from "@/lib/utils"
import {
  Ban,
  ShieldCheck,
  Loader2,
  User,
  Crown,
  Trash2,
  AlertTriangle,
  Eye,
  Plus,
  X,
  Mail,
  Phone,
  ExternalLink,
  CreditCard,
  Home,
  Star,
} from "lucide-react"
import { useRouter } from "next/navigation"

interface UserWithCounts extends Profile {
  listings: { count: number }[]
}

interface AccountData {
  listings: {
    id: string
    title: string
    status: string
    is_featured: boolean
    is_urgent: boolean
    views_count: number
    created_at: string
  }[]
  subscription: {
    plan: string
    active: boolean
    expires_at: string | null
    is_trial: boolean | null
    billing_cycle: string | null
    amount_paid: number | null
  } | null
  payments: {
    amount: number
    type: string
    status: string
    created_at: string
    paystack_reference: string | null
  }[]
  avgRating: string | null
  reviewCount: number
}

// ──────────────────────────────────────────────────────────────────────────────
// Account Summary Slide-over Panel (super_admin only)
// ──────────────────────────────────────────────────────────────────────────────
function AccountPanel({
  user,
  onClose,
}: {
  user: UserWithCounts
  onClose: () => void
}) {
  const supabase = createClient()
  const [accountData, setAccountData] = useState<AccountData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAccountData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch listings, subscription, and payments in parallel.
      // Reviews use a two-step approach to avoid fragile PostgREST join filter syntax.
      const [listingsRes, subscriptionRes, paymentsRes] = await Promise.all([
        supabase
          .from("listings")
          .select("id, title, status, is_featured, is_urgent, views_count, created_at")
          .eq("landlord_id", user.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("subscriptions")
          .select("plan, active, expires_at, is_trial, billing_cycle, amount_paid")
          .eq("landlord_id", user.id)
          .eq("active", true)
          .maybeSingle(),

        supabase
          .from("payments")
          .select("amount, type, status, created_at, paystack_reference")
          .eq("landlord_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
      ])

      // Step 1: Collect listing IDs owned by this landlord.
      const listingIds = (listingsRes.data ?? []).map((l) => l.id)

      // Step 2: Fetch reviews for those listings (avoids fragile embedded join filter).
      let avgRating: string | null = null
      let reviewCount = 0
      if (listingIds.length > 0) {
        const { data: reviews } = await supabase
          .from("reviews")
          .select("rating")
          .in("listing_id", listingIds)
        if (reviews && reviews.length > 0) {
          avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
          reviewCount = reviews.length
        }
      }

      setAccountData({
        listings: listingsRes.data ?? [],
        subscription: subscriptionRes.data ?? null,
        payments: paymentsRes.data ?? [],
        avgRating,
        reviewCount,
      })
    } finally {
      setLoading(false)
    }
  }, [user.id])

  // Escape key closes the panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  useEffect(() => {
    fetchAccountData()
  }, [fetchAccountData])

  const planBadgeColor = (plan: string) => {
    if (plan === "business") return "bg-amber-100 text-amber-800"
    if (plan === "pro") return "bg-purple-100 text-purple-800"
    return "bg-gray-100 text-gray-600"
  }

  const statusColor = (status: string) => {
    if (status === "active") return "bg-green-100 text-green-700"
    if (status === "pending") return "bg-amber-100 text-amber-700"
    return "bg-red-100 text-red-700"
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Account Summary">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="font-bold text-gray-900">Account Summary</h2>
            <p className="text-xs text-gray-400">Super Admin View</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          {/* User Identity */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#1B4332]/10 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-[#1B4332]/20">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-[#1B4332]" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-900 truncate">{user.full_name}</p>
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                    user.role === "agent"
                      ? "bg-blue-50 text-blue-700"
                      : user.role === "student"
                      ? "bg-gray-100 text-gray-700"
                      : "bg-[#1B4332]/10 text-[#1B4332]"
                  }`}
                >
                  {user.role}
                </span>
                {user.verification_status === "verified" && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </span>
                )}
                {user.banned && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                    Banned
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          {(user.role === "landlord" || user.role === "agent") && (
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "Listings",
                  value: loading ? "—" : accountData?.listings.length ?? "—",
                  icon: <Home className="w-4 h-4" />,
                },
                {
                  label: "Avg Rating",
                  value: loading ? "—" : accountData?.avgRating ?? "—",
                  icon: <Star className="w-4 h-4" />,
                },
                {
                  label: "Reviews",
                  value: loading ? "—" : accountData?.reviewCount ?? "—",
                  icon: <Star className="w-4 h-4" />,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100"
                >
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Subscription (only for landlord/agent) */}
          {(user.role === "landlord" || user.role === "agent") && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-gray-400" />
                Current Plan
              </h3>
              {loading ? (
                <div className="bg-gray-50 rounded-xl p-4 animate-pulse h-16" />
              ) : accountData?.subscription ? (
                <div className="bg-[#1B4332]/5 rounded-xl p-4 border border-[#1B4332]/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[#1B4332] capitalize">
                        {accountData.subscription.plan} Plan
                        {accountData.subscription.is_trial && (
                          <span className="ml-1.5 text-xs font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
                            Trial
                          </span>
                        )}
                      </p>
                      {accountData.subscription.billing_cycle && (
                        <p className="text-xs text-gray-500 mt-0.5 capitalize">
                          {accountData.subscription.billing_cycle} billing
                        </p>
                      )}
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      Active
                    </span>
                  </div>
                  {accountData.subscription.expires_at && (
                    <p className="text-xs text-gray-500 mt-2">
                      Expires:{" "}
                      {new Date(accountData.subscription.expires_at).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-sm text-gray-500">Free plan — no active subscription</p>
                </div>
              )}
            </div>
          )}

          {/* Listings (landlord/agent only) */}
          {(user.role === "landlord" || user.role === "agent") && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <Home className="w-4 h-4 text-gray-400" />
                Listings
              </h3>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3 animate-pulse h-14" />
                  ))}
                </div>
              ) : accountData && accountData.listings.length > 0 ? (
                <div className="space-y-2">
                  {accountData.listings.map((listing) => (
                    <div
                      key={listing.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {listing.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {listing.views_count ?? 0} views
                          {listing.is_featured && (
                            <span className="ml-2 text-[#F59E0B] font-medium">★ Featured</span>
                          )}
                          {listing.is_urgent && (
                            <span className="ml-2 text-red-500 font-medium">🔥 Urgent</span>
                          )}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize shrink-0 ${statusColor(
                          listing.status
                        )}`}
                      >
                        {listing.status}
                      </span>
                      <a
                        href={`/listing/${listing.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-300 hover:text-[#1B4332] transition-colors shrink-0"
                        title="View listing"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 text-center border border-dashed border-gray-200">
                  <p className="text-sm text-gray-400">No listings yet</p>
                </div>
              )}
            </div>
          )}

          {/* Recent Payments (landlord/agent only) */}
          {(user.role === "landlord" || user.role === "agent") && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-gray-400" />
                Recent Payments
              </h3>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3 animate-pulse h-12" />
                  ))}
                </div>
              ) : accountData && accountData.payments.length > 0 ? (
                <div className="space-y-2">
                  {accountData.payments.map((payment, i) => (
                    <div
                      key={payment.paystack_reference ?? i}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {payment.type.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDate(payment.created_at)} ·{" "}
                          <span
                            className={
                              payment.status === "success"
                                ? "text-green-600"
                                : payment.status === "pending"
                                ? "text-amber-600"
                                : "text-red-500"
                            }
                          >
                            {payment.status}
                          </span>
                        </p>
                      </div>
                      <p className="text-sm font-bold text-[#1B4332]">
                        {formatNaira(payment.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 text-center border border-dashed border-gray-200">
                  <p className="text-sm text-gray-400">No payments yet</p>
                </div>
              )}
            </div>
          )}

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-gray-400" />
              Contact Info
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-700 truncate">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-700 flex-1">{user.phone}</span>
                  <a
                    href={`https://wa.me/${user.phone.replace(/\D/g, "").replace(/^0/, "234")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-600 font-semibold hover:underline shrink-0"
                  >
                    WhatsApp ↗
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-gray-400">Joined</span>
                <span className="text-sm text-gray-600">{formatDate(user.created_at)}</span>
              </div>
            </div>
          </div>

          {/* CTA: Create Listing for this User */}
          {(user.role === "landlord" || user.role === "agent") && (
            <div className="pt-2">
              <a
                href={`/admin/listings/create?for=${user.id}&name=${encodeURIComponent(
                  user.full_name
                )}`}
                className="w-full flex items-center justify-center gap-2 bg-[#1B4332] text-white rounded-xl py-3 text-sm font-semibold hover:bg-[#2D5A47] transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Create Listing for this User
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Role badge helper
// ──────────────────────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    super_admin: "bg-amber-100 text-amber-800 border border-amber-200",
    admin: "bg-purple-100 text-purple-800",
    landlord: "bg-blue-100 text-blue-800",
    agent: "bg-cyan-100 text-cyan-800",
    student: "bg-gray-100 text-gray-700",
  }
  return (
    <span
      className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full ${
        styles[role] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {role.replace(/_/g, " ")}
    </span>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Main Table Component
// ──────────────────────────────────────────────────────────────────────────────
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
  const [userToBan, setUserToBan] = useState<UserWithCounts | null>(null)
  const [banReason, setBanReason] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [viewingUser, setViewingUser] = useState<UserWithCounts | null>(null)

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
    } catch {
      alert("Something went wrong")
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleBan = async (id: string, isBanned: boolean, reason?: string) => {
    if (isBanned) {
      if (!confirm("Are you sure you want to unban this user?")) return
    } else {
      if (!reason) return
    }
    
    setLoading(id)
    try {
      const res = await fetch("/api/admin/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: id,
          action: isBanned ? "unban" : "ban",
          reason: isBanned ? null : reason,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }
      setUserToBan(null)
      setBanReason("")
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : `Failed to ${isBanned ? "unban" : "ban"} user`
      alert(msg)
    } finally {
      setLoading(null)
    }
  }

  const isLandlordOrAgent = (role: string) => role === "landlord" || role === "agent"

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Listings</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users?.map((user) => (
                <tr
                  key={user.id}
                  className={`hover:bg-gray-50/70 transition-colors ${
                    user.banned ? "bg-red-50/30" : ""
                  }`}
                >
                  {/* User cell */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 ring-1 ring-gray-200">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <User className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-gray-900 text-sm">
                            {user.full_name}
                          </span>
                          {user.role === "super_admin" && (
                            <span title="Super Admin">
                              <Crown className="w-3.5 h-3.5 text-amber-500" />
                            </span>
                          )}
                          {user.role === "landlord" &&
                            user.verification_status === "verified" && (
                              <ShieldCheck
                                className="w-3.5 h-3.5 text-emerald-500"
                                aria-hidden="true"
                              />
                            )}
                          {user.role === "landlord" &&
                            user.verification_status === "pending" && (
                              <div
                                className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"
                                title="Verification pending"
                              />
                            )}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">{user.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4">
                    <RoleBadge role={user.role} />
                  </td>

                  {/* Listings count */}
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {user.listings?.[0]?.count || 0}
                  </td>

                  {/* Joined */}
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(user.created_at)}</td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    {user.banned ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                        Banned
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                        Active
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1 flex-wrap">
                      {/* View Account — super_admin only, all users */}
                      {isSuperAdmin && (
                        <button
                          onClick={() => setViewingUser(user)}
                          className="flex items-center gap-1.5 text-gray-500 hover:text-[#1B4332] hover:bg-gray-100 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
                          title="View Account Summary"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      )}

                      {/* Create Listing — all admins, landlord/agent only */}
                      {isLandlordOrAgent(user.role) && (
                        <a
                          href={`/admin/listings/create?for=${user.id}&name=${encodeURIComponent(
                            user.full_name
                          )}`}
                          className="flex items-center gap-1.5 text-[#1B4332] hover:bg-green-50 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors border border-[#1B4332]/20"
                          title="Create listing on behalf of this user"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Create Listing
                        </a>
                      )}

                      {/* WhatsApp — all admins, landlord/agent only */}
                      {isLandlordOrAgent(user.role) && user.phone && (
                        <a
                          href={`https://wa.me/${user.phone.replace(/\D/g, "").replace(/^0/, "234")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-green-600 hover:bg-green-50 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors border border-green-200"
                          title="Contact on WhatsApp"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          WhatsApp
                        </a>
                      )}

                      {/* Ban / Unban */}
                      <button
                        onClick={() => user.banned ? handleToggleBan(user.id, true) : setUserToBan(user)}
                        disabled={loading === user.id}
                        className={`p-2 rounded-lg transition-colors ${
                          user.banned
                            ? "text-green-600 hover:bg-green-50"
                            : "text-red-500 hover:bg-red-50"
                        } disabled:opacity-50`}
                        title={user.banned ? "Unban User" : "Ban User"}
                      >
                        {loading === user.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : user.banned ? (
                          <ShieldCheck className="w-4 h-4" />
                        ) : (
                          <Ban className="w-4 h-4" />
                        )}
                      </button>

                      {/* Delete — super_admin only, can't delete self or other super_admins */}
                      {isSuperAdmin &&
                        user.role !== "super_admin" &&
                        user.id !== currentUserId && (
                          <button
                            onClick={() => setUserToDelete(user)}
                            className="flex items-center gap-1.5 text-red-500 hover:bg-red-50 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
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
      </div>

      {/* Account Summary Slide-over */}
      {viewingUser && (
        <AccountPanel user={viewingUser} onClose={() => setViewingUser(null)} />
      )}

      {/* Ban User Modal */}
      {userToBan && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <Ban className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Ban User</h3>
                  <p className="text-xs text-gray-500">{userToBan.full_name} ({userToBan.email})</p>
                </div>
              </div>
              <button onClick={() => { setUserToBan(null); setBanReason(""); }} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label htmlFor="banReason" className="block text-sm font-medium text-gray-700">Reason for ban (required)</label>
              <textarea
                id="banReason"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4332] outline-none text-sm resize-none"
                placeholder="E.g. Fraudulent listings, inappropriate behavior..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
              <p className="text-xs text-gray-500">An email will be sent to the user explaining why they were suspended and how to appeal.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setUserToBan(null); setBanReason(""); }}
                disabled={loading === userToBan.id}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleToggleBan(userToBan.id, false, banReason)}
                disabled={loading === userToBan.id || !banReason.trim()}
                className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {loading === userToBan.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Banning...
                  </>
                ) : (
                  "Confirm Ban"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete User</h3>
                <p className="text-xs text-gray-500">This action is irreversible</p>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold">{userToDelete.full_name}</span> (
              {userToDelete.email})?
            </p>

            <div className="bg-red-50 rounded-xl p-3 border border-red-100">
              <p className="text-xs text-red-700 leading-relaxed">
                This will permanently delete their account, all their listings, reviews,
                subscriptions, payments, and verification documents. This cannot be undone.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setUserToDelete(null)}
                disabled={deleting}
                className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
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
    </>
  )
}
