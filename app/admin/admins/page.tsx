import { createClient } from "@/lib/supabase/server"
import { AdminList } from "@/components/admin/admin-list"
import { AddAdminForm } from "@/components/admin/add-admin-form"

export default async function AdminsPage() {
  const supabase = createClient()

  const { data: admins } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['admin', 'super_admin'])
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-black text-[#1B4332]">Admin Accounts</h1>
        <p className="text-gray-500 font-medium">Manage platform administrators and permissions</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Current Admins */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
           <div className="p-8 border-b border-gray-50">
              <h3 className="text-lg font-bold text-gray-900">System Administrators</h3>
           </div>
           <AdminList admins={admins || []} />
        </div>

        {/* Add New Admin */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
           <div className="p-8 border-b border-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Add New Admin</h3>
              <p className="text-sm text-gray-500 mt-1 font-medium">Search for an existing user to promote them</p>
           </div>
           <div className="p-8">
              <AddAdminForm />
           </div>
        </div>
      </div>
    </div>
  )
}
