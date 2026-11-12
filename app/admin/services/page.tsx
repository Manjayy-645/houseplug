import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getAdminClient } from "@/lib/supabase/server"
import { ServiceModerationList, type AdminServiceItem } from "@/components/admin/service-moderation-list"
import { Wrench, ShieldCheck, Plus, ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "Campus Services Moderation | HousePlug Admin",
  robots: { index: false, follow: false },
}

export default async function AdminServicesPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const supabase = createClient()
  const db = getAdminClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?next=/admin/services")
  }

  const { data: profile } = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!["admin", "super_admin"].includes(profile?.role || "")) {
    redirect("/")
  }

  // 1. Resilient select without PostgREST foreign key joins (guarantees rows always return)
  const { data: servicesRaw, error } = await db
    .from("service_providers")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(250)

  if (error) {
    console.error("[ADMIN_SERVICES] Error fetching service_providers:", error)
  }

  // 2. Resiliently fetch owner profiles in a separate lookup
  const userIds = [
    ...new Set(
      (servicesRaw ?? [])
        .map((s: any) => s.user_id)
        .filter(Boolean)
    ),
  ]

  let profilesMap = new Map<string, any>()
  if (userIds.length > 0) {
    const { data: profiles, error: pError } = await db
      .from("profiles")
      .select("id, full_name, email, role, phone")
      .in("id", userIds)

    if (pError) {
      console.error("[ADMIN_SERVICES] Error fetching provider profiles:", pError)
    } else if (profiles) {
      profilesMap = new Map(profiles.map((p: any) => [p.id, p]))
    }
  }

  // 3. Map into strongly-typed items safely
  const services: AdminServiceItem[] = (servicesRaw ?? []).map((s: any) => {
    const owner = s.user_id ? profilesMap.get(s.user_id) : null
    return {
      id: s.id,
      user_id: s.user_id || "",
      business_name: s.business_name || "Untitled Service",
      category: s.category || "repairs",
      university: s.university || "",
      description: s.description || "",
      pricing_type: s.pricing_type || "starting_from",
      price_amount: s.price_amount ?? null,
      price_unit: s.price_unit || "job",
      whatsapp_number: s.whatsapp_number || "",
      is_student_owned: Boolean(s.is_student_owned),
      status: s.status || "pending",
      vetted_at: s.vetted_at || null,
      vetting_expires_at: s.vetting_expires_at || null,
      safety_requirements: s.safety_requirements || null,
      service_hours: s.service_hours || null,
      created_at: s.created_at || new Date().toISOString(),
      owner: owner
        ? {
            full_name: owner.full_name || null,
            email: owner.email || null,
            role: owner.role || null,
            phone: owner.phone || null,
          }
        : null,
    }
  })

  // Normalize pending count
  const pendingCount = services.filter((s) => {
    const st = (s.status || "").trim().toLowerCase()
    return st === "pending" || st === "in_review" || st === "new" || !st
  }).length

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="text-gray-400 hover:text-gray-600 transition p-1 -ml-1 rounded-lg"
              title="Back to Admin Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-black text-[#1B4332]">
              Campus Services Moderation
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Review and approve student and vendor housing services. Approved services appear live on the public services marketplace.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {pendingCount > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black flex items-center gap-1.5 animate-pulse">
              <span className="h-2 w-2 rounded-full bg-amber-600" />
              <span>{pendingCount} Pending Review</span>
            </div>
          )}

          <Link
            href="/admin/service-requests"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 transition shadow-2xs"
          >
            <span>Student Enquiries</span>
          </Link>

          <Link
            href="/services/manage"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1B4332] hover:bg-[#143427] text-xs font-bold text-white transition shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Service</span>
          </Link>
        </div>
      </div>

      {/* Main interactive moderation list */}
      <ServiceModerationList
        initialServices={services}
        defaultStatus={searchParams.status}
      />
    </div>
  )
}
