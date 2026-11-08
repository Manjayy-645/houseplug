import { createClient, getAdminClient } from "@/lib/supabase/server"
import UserTable from "@/components/admin/user-table"
import Link from "next/link"

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { role?: string; search?: string; page?: string }
}) {
  const supabase = createClient()
  const db = getAdminClient()

  const currentRole = searchParams.role || "all"
  const search = searchParams.search || ""
  const currentPage = parseInt(searchParams.page || "1")
  const pageSize = 20

  let query = db
    .from("profiles")
    .select(`
      *,
      listings:listings(count)
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range((currentPage - 1) * pageSize, currentPage * pageSize - 1)

  if (currentRole !== "all") {
    query = query.eq("role", currentRole)
  }

  if (search) {
    const terms = search.trim().split(/\s+/).filter(Boolean)
    terms.forEach(term => {
      const safeTerm = term.replace(/[,'\"()\\\\]/g, '')
      if (safeTerm) {
        query = query.or(`full_name.ilike.%${safeTerm}%,email.ilike.%${safeTerm}%,phone.ilike.%${safeTerm}%`)
      }
    })
  }

  // Parallel fetch: data query and caller authentication
  const [{ data: users, count, error }, authRes] = await Promise.all([
    query,
    supabase.auth.getUser()
  ])

  // Caller identity — gates the super-admin-only delete action in the table.
  const currentUser = authRes.data?.user
  const { data: currentProfile } = currentUser
    ? await db.from("profiles").select("role").eq("id", currentUser.id).single()
    : { data: null }
  const isSuperAdmin = currentProfile?.role === "super_admin"

  if (error) {
    console.error("[ADMIN_USERS] Error fetching users:", error)
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-2xl text-red-700">
        <h2 className="text-lg font-bold">Error loading users</h2>
        <p className="text-sm opacity-90">{error.message}</p>
        <p className="mt-4 text-xs font-mono bg-white/50 p-2 rounded">Code: {error.code}</p>
      </div>
    )
  }

  const roleTabs = [
    { value: "all", label: "All" },
    { value: "student", label: "Students" },
    { value: "landlord", label: "Landlords" },
    { value: "agent", label: "Agents" },
    { value: "service_provider", label: "Service Providers" },
    { value: "admin", label: "Admins" },
    { value: "super_admin", label: "Super Admins" },
  ]

  const totalPages = Math.ceil((count || 0) / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#1B4332]">User Management</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <form className="flex gap-2 w-full md:w-auto">
          {currentRole !== "all" && (
            <input type="hidden" name="role" value={currentRole} />
          )}
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search name, email, or phone..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4332] outline-none w-full md:w-64"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#1B4332] text-white rounded-lg hover:bg-[#2D5A47] transition-colors"
          >
            Search
          </button>
        </form>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {roleTabs.map((tab) => (
            <Link
              key={tab.value}
              href={`/admin/users?role=${tab.value}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                currentRole === tab.value
                  ? "bg-[#1B4332] text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {!users || users.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-gray-500">No users found matching your criteria.</p>
          <Link href="/admin/users" className="mt-4 inline-block text-primary font-semibold hover:underline">
            Clear all filters
          </Link>
        </div>
      ) : (
        <>
          <UserTable users={users as any[]} isSuperAdmin={isSuperAdmin} currentUserId={currentUser?.id ?? null} />

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }).map((_, i) => (
                <Link
                  key={i}
                  href={`/admin/users?role=${currentRole}${search ? `&search=${encodeURIComponent(search)}` : ""}&page=${i + 1}`}
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
        </>
      )}
    </div>
  )
}
