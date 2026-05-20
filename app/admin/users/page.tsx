import { createClient } from "@/lib/supabase/server"
import UserTable from "@/components/admin/user-table"
import Link from "next/link"

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { role?: string; search?: string; page?: string }
}) {
  const supabase = createClient()

  const currentRole = searchParams.role || "all"
  const search = searchParams.search || ""
  const currentPage = parseInt(searchParams.page || "1")
  const pageSize = 20

  let query = supabase
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
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data: users, count, error } = await query
  
  if (error) {
    console.error("[ADMIN_USERS] Error fetching users:", error)
  }

  const totalPages = Math.ceil((count || 0) / pageSize)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#1B4332]">User Management</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <form className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search name or email..."
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
          {["all", "student", "landlord", "admin", "super_admin"].map((role) => (
            <Link
              key={role}
              href={`/admin/users?role=${role}&search=${search}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap ${
                currentRole === role
                  ? "bg-[#1B4332] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {role}
            </Link>
          ))}
        </div>
      </div>

      <UserTable users={users as any[]} />

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }).map((_, i) => (
            <Link
              key={i}
              href={`/admin/users?role=${currentRole}&search=${search}&page=${i + 1}`}
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
