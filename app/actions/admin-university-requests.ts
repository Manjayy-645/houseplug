"use server"

import { createClient } from "@/lib/supabase/server"

export interface UniversityRequestSummary {
  normalized_name: string
  total_requests: number
  student_requests: number
  landlord_requests: number
  unique_contacts: number
  last_requested_at: string
  reported_areas: string[] | null
}

async function verifyAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  return ["admin", "super_admin"].includes(profile?.role || "")
}

export async function fetchUniversityRequestsSummary(search?: string): Promise<{ data?: UniversityRequestSummary[], error?: string }> {
  const isAdmin = await verifyAdmin()
  if (!isAdmin) {
    return { error: "Access denied. Administrator privileges required." }
  }

  const supabase = createClient()
  const { data, error } = await supabase.rpc("get_university_requests_summary", { search_query: search || "" })

  if (error) {
    console.error("[SERVER ACTION] fetchUniversityRequestsSummary error:", error)
    return { error: "Failed to fetch university requests." }
  }

  return { data: data as UniversityRequestSummary[] }
}

export async function exportUniversityWaitlistContacts(universityName: string) {
  const isAdmin = await verifyAdmin()
  if (!isAdmin) {
    return { error: "Access denied. Administrator privileges required." }
  }

  const supabase = createClient()
  
  // We need to fetch from the raw table where normalized name matches.
  // Wait, RPC would be safer, or we can just fetch using server client with service_role if RLS restricts.
  // The prompt allows using server client or regular authenticated query if RLS allows admin.
  // Actually, we can fetch all and filter in JS if it's small, or query using ILIKE or a helper function.
  // Let's do a direct query. The raw table doesn't have an admin-read policy directly yet (only insert in migration 043, and select on view).
  // I will use service role to read raw records for export, since RLS on public.university_requests was only enabled for INSERT.
  
  const { createClient: createServiceClient } = await import("@supabase/supabase-js")
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await serviceClient
    .from("university_requests")
    .select("contact_info, role, campus_area, university_name")

  if (error || !data) {
    return { error: "Failed to fetch waitlist contacts." }
  }

  // Filter in memory for exact normalized match
  const normalizedTarget = universityName.trim().toLowerCase()
  const filtered = data.filter(row => {
    return row.university_name.trim().toLowerCase() === normalizedTarget
  })

  // Format as CSV
  const headers = ["Contact Info", "Role", "Campus Area"]
  const rows = filtered.map(r => [
    `"${r.contact_info.replace(/"/g, '""')}"`,
    `"${r.role}"`,
    `"${(r.campus_area || "").replace(/"/g, '""')}"`
  ])
  
  const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
  return { csv: csvContent }
}
