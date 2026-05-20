import { createClient } from "@/lib/supabase/server"
import { Profile } from "@/types"
import Link from "next/link"
import { ShieldCheck, Clock, CheckCircle2, XCircle, Users } from "lucide-react"
import { VerificationTable } from "@/components/admin/verification-table"

export default async function AdminVerificationPage({
  searchParams,
}: {
  searchParams: { status?: Profile["verification_status"] | "all"; page?: string }
}) {
  const supabase = createClient()

  const currentStatus = searchParams.status || "pending"
  const currentPage = parseInt(searchParams.page || "1")
  const pageSize = 20

  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .eq("role", "landlord")
    .order("created_at", { ascending: false })
    .range((currentPage - 1) * pageSize, currentPage * pageSize - 1)

  if (currentStatus !== "all") {
    query = query.eq("verification_status", currentStatus)
  }

  const { data: landlords, count, error } = await query
  
  if (error) {
    console.error("[ADMIN_VERIFY] Error fetching landlords:", error)
  }

  // Fetch pending count for badge
  const { count: pendingCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "landlord")
    .eq("verification_status", "pending")

  const tabs = [
    { label: "Pending", value: "pending", icon: Clock, badge: pendingCount },
    { label: "Verified", value: "verified", icon: CheckCircle2 },
    { label: "Rejected", value: "rejected", icon: XCircle },
    { label: "All", value: "all", icon: Users },
  ]

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-2xl text-primary">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Landlord Verification</h1>
            <p className="text-gray-500 font-medium">Review and approve landlord identities</p>
          </div>
        </div>
        {pendingCount ? (
          <div className="bg-red-50 text-red-600 px-4 py-2 rounded-2xl border border-red-100 flex items-center gap-2 animate-pulse">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="font-bold text-sm">{pendingCount} Pending Review</span>
          </div>
        ) : null}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto bg-gray-50/30 scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = currentStatus === tab.value
            return (
              <Link
                key={tab.value}
                href={`/admin/verification?status=${tab.value}`}
                className={`relative px-8 py-5 text-sm font-bold flex items-center gap-2 transition-all group ${
                  active
                    ? "text-primary bg-white shadow-[0_4px_20px_rgba(27,67,50,0.05)]"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-gray-400 group-hover:text-gray-600"}`} />
                {tab.label}
                {tab.badge ? (
                  <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-black ${
                    active ? "bg-primary text-white" : "bg-gray-200 text-gray-500"
                  }`}>
                    {tab.badge}
                  </span>
                ) : null}
                {active && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                )}
              </Link>
            )
          })}
        </div>

        <div className="p-2">
          <VerificationTable landlords={landlords as Profile[]} currentStatus={currentStatus as any} />
        </div>
      </div>

      {count && count > pageSize && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: Math.ceil(count / pageSize) }).map((_, i) => (
            <Link
              key={i}
              href={`/admin/verification?status=${currentStatus}&page=${i + 1}`}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition ${
                currentPage === i + 1
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50"
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
