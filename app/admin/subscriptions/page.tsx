import { createClient } from "@/lib/supabase/server"
import { formatDate } from "@/lib/utils"
import { CreditCard, CheckCircle2, XCircle, User } from "lucide-react"
import Link from "next/link"

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const supabase = createClient()

  const currentPage = parseInt(searchParams.page || "1")
  const pageSize = 20

  const { data: subscriptions, count, error } = await supabase
    .from("subscriptions")
    .select(`
      *,
      landlord:profiles(*)
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range((currentPage - 1) * pageSize, currentPage * pageSize - 1)

  if (error) {
    console.error("[ADMIN_SUBS] Error fetching subscriptions:", error)
  }

  const totalPages = Math.ceil((count || 0) / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#1B4332]">Subscription Management</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600">
                <th className="px-6 py-4">Landlord</th>
                <th className="px-6 py-4">Plan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Expires</th>
                <th className="px-6 py-4">Started</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {subscriptions?.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="text-sm font-medium text-gray-900">{sub.landlord?.full_name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                      sub.plan === 'pro' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {sub.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {sub.active ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-sm text-gray-700">{sub.active ? "Active" : "Expired"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {sub.expires_at ? formatDate(sub.expires_at) : "Never"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(sub.created_at)}
                  </td>
                </tr>
              ))}
              {(!subscriptions || subscriptions.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <CreditCard className="w-8 h-8 text-gray-300" />
                      <p>No subscriptions found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }).map((_, i) => (
            <Link
              key={i}
              href={`/admin/subscriptions?page=${i + 1}`}
              className={`px-4 py-2 rounded ${
                currentPage === i + 1
                  ? "bg-[#1B4332] text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {i + 1}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
