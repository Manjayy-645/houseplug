import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { UserCog, ArrowLeft, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { AdminListingForm } from "@/components/admin/admin-listing-form"

interface PageProps {
  searchParams: { for?: string; name?: string }
}

export default async function AdminCreateListingPage({ searchParams }: PageProps) {
  const supabase = createClient()

  // Gate: must be an admin or super_admin
  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser()
  if (!adminUser) redirect("/login")

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", adminUser.id)
    .single()

  if (!["admin", "super_admin"].includes(adminProfile?.role ?? "")) {
    redirect("/")
  }

  const forUserId = searchParams.for
  const forUserName = searchParams.name
    ? decodeURIComponent(searchParams.name)
    : null

  // Both params are required
  if (!forUserId || !forUserName) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
        <AlertTriangle className="h-14 w-14 text-amber-400" />
        <h2 className="text-xl font-bold text-gray-900">Missing target user</h2>
        <p className="text-gray-500 max-w-sm">
          This page requires a target user ID and name. Please navigate here from the User
          Management table.
        </p>
        <Link
          href="/admin/users"
          className="flex items-center gap-2 text-sm font-semibold text-[#1B4332] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </Link>
      </div>
    )
  }

  // Verify the target user exists and is a landlord/agent using service role
  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: targetProfile, error: profileError } = await service
    .from("profiles")
    .select("id, full_name, role, phone, verification_status")
    .eq("id", forUserId)
    .single()

  if (profileError || !targetProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
        <AlertTriangle className="h-14 w-14 text-red-400" />
        <h2 className="text-xl font-bold text-gray-900">User not found</h2>
        <p className="text-gray-500 max-w-sm">
          The target user could not be found. They may have been deleted.
        </p>
        <Link
          href="/admin/users"
          className="flex items-center gap-2 text-sm font-semibold text-[#1B4332] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </Link>
      </div>
    )
  }

  if (!["landlord", "agent"].includes(targetProfile.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
        <AlertTriangle className="h-14 w-14 text-amber-400" />
        <h2 className="text-xl font-bold text-gray-900">Cannot create listing for this user</h2>
        <p className="text-gray-500 max-w-sm">
          Listings can only be created for users with the{" "}
          <strong>landlord</strong> or <strong>agent</strong> role.{" "}
          <span className="capitalize">{targetProfile.full_name}</span> has the role:{" "}
          <strong>{targetProfile.role}</strong>.
        </p>
        <Link
          href="/admin/users"
          className="flex items-center gap-2 text-sm font-semibold text-[#1B4332] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </Link>
      </div>
    )
  }

  const isAgent = targetProfile.role === "agent"

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-4 lg:p-0">
      {/* Back link */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1B4332] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to User Management
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1B4332]">Create Listing on Behalf</h1>
      </div>

      {/* Impersonation Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <UserCog className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">
            Creating listing on behalf of {targetProfile.full_name ?? "this user"}
          </p>
          <p className="text-xs text-amber-600 mt-0.5">
            This listing will be attributed to their account, not yours. It will go through
            the normal pending → approval flow. An admin notification email will be sent and
            the action will be logged in the audit trail.
          </p>
          {targetProfile.verification_status !== "verified" && (
            <p className="text-xs text-amber-700 font-medium mt-1.5">
              ⚠ This user's account is not yet verified ({targetProfile.verification_status}).
            </p>
          )}
        </div>
      </div>

      {/* The listing form — all the same fields, different landlordId */}
      <AdminListingForm
        landlordId={forUserId}
        forUserName={targetProfile.full_name ?? "Unknown User"}
        forUserPhone={targetProfile.phone ?? null}
        adminId={adminUser.id}
        adminName={adminProfile?.full_name ?? "Admin"}
        isAgent={isAgent}
      />
    </div>
  )
}
