import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getAdminClient } from "@/lib/supabase/server"
import { ArrowLeft, Clock, MessageSquare, Wrench } from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "Service Enquiries | HousePlug Admin",
  robots: { index: false, follow: false },
}

export default async function ServiceRequestsPage() {
  const supabase = createClient()
  const db = getAdminClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?next=/admin/service-requests")
  }

  const { data: profile } = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!["admin", "super_admin"].includes(profile?.role || "")) {
    redirect("/")
  }

  const { data, error } = await db
    .from("service_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) {
    console.error("[ADMIN_SERVICE_REQUESTS] Error fetching service_requests:", error)
  }

  // Resilient provider lookup
  const providerIds = [...new Set((data ?? []).map((s: any) => s.provider_id).filter(Boolean))]
  let providersMap = new Map<string, any>()
  if (providerIds.length > 0) {
    const { data: providers } = await db
      .from("service_providers")
      .select("id, business_name, category, university")
      .in("id", providerIds)
    if (providers) {
      providersMap = new Map(providers.map((p: any) => [p.id, p]))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/services"
              className="text-gray-400 hover:text-gray-600 transition p-1 -ml-1 rounded-lg"
              title="Back to Campus Services"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-black text-[#1B4332]">
              Student Service Enquiries
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Enquiries and assistance requests sent by students for verified campus housing services.
          </p>
        </div>

        <Link
          href="/admin/services"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 transition shadow-2xs self-start sm:self-auto"
        >
          <Wrench className="h-3.5 w-3.5" />
          <span>Service Moderation Portal</span>
        </Link>
      </div>

      {(data ?? []).length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center">
          <div className="h-12 w-12 rounded-full bg-emerald-50 text-[#1B4332] flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No enquiries found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            When students submit service enquiries through provider listings, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {(data ?? []).map((s: any) => {
            const provider = providersMap.get(s.provider_id)
            return (
              <article
                className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-3"
                key={s.id}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 uppercase tracking-wider">
                      {s.status || "new"}
                    </span>
                    {provider && (
                      <span className="text-xs font-bold text-gray-800">
                        {provider.business_name} ({provider.category}) · {provider.university}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium">
                    {s.created_at ? new Date(s.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" }) : ""}
                  </span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 p-3 rounded-xl border border-gray-100">
                  {s.description}
                </p>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
