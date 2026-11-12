import { redirect } from "next/navigation"
import Link from "next/link"
import { requestActor } from "@/lib/request-auth"
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
  const actor = await requestActor()
  if (!actor?.admin) {
    redirect("/login?next=/admin/services")
  }

  // Fetch all service providers with owner profile details
  const { data: servicesRaw, error } = await actor.db
    .from("service_providers")
    .select(`
      id,
      user_id,
      business_name,
      category,
      university,
      description,
      pricing_type,
      price_amount,
      price_unit,
      whatsapp_number,
      is_student_owned,
      status,
      vetted_at,
      vetting_expires_at,
      safety_requirements,
      service_hours,
      created_at,
      owner:profiles!user_id(full_name, email, role, phone)
    `)
    .order("created_at", { ascending: false })
    .limit(250)

  if (error) {
    console.error("[ADMIN_SERVICES] Error fetching services:", error)
  }

  // Map into typed items safely
  const services: AdminServiceItem[] = (servicesRaw ?? []).map((s: any) => ({
    id: s.id,
    user_id: s.user_id,
    business_name: s.business_name || "Untitled Service",
    category: s.category || "repairs",
    university: s.university || "",
    description: s.description || "",
    pricing_type: s.pricing_type || "starting_from",
    price_amount: s.price_amount,
    price_unit: s.price_unit,
    whatsapp_number: s.whatsapp_number || "",
    is_student_owned: Boolean(s.is_student_owned),
    status: s.status || "pending",
    vetted_at: s.vetted_at,
    vetting_expires_at: s.vetting_expires_at,
    safety_requirements: s.safety_requirements,
    service_hours: s.service_hours,
    created_at: s.created_at || new Date().toISOString(),
    owner: s.owner
      ? {
          full_name: s.owner.full_name,
          email: s.owner.email,
          role: s.owner.role,
          phone: s.owner.phone,
        }
      : null,
  }))

  const pendingCount = services.filter((s) => s.status === "pending").length

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

        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black flex items-center gap-1.5 animate-pulse">
              <span className="h-2 w-2 rounded-full bg-amber-600" />
              <span>{pendingCount} Pending Review</span>
            </div>
          )}

          <Link
            href="/services/manage"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 transition shadow-2xs"
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
