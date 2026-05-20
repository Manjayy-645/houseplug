import { createClient } from "@/lib/supabase/server"
import { formatDate } from "@/lib/utils"
import { Search, Filter, Calendar, ChevronLeft, ChevronRight } from "lucide-react"

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: { q?: string; action?: string; page?: string }
}) {
  const supabase = createClient()
  const page = parseInt(searchParams.page || '1')
  const pageSize = 50

  let query = supabase
    .from('audit_logs')
    .select('*, admin:profiles(full_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (searchParams.action && searchParams.action !== 'all') {
    query = query.eq('action', searchParams.action)
  }

  const { data: logs, count } = await query

  const getActionColor = (action: string) => {
    if (action.startsWith('approved_') || action.startsWith('verified_')) return 'bg-emerald-50 text-emerald-700'
    if (action.startsWith('rejected_') || action.startsWith('banned_') || action.startsWith('deleted_') || action.startsWith('revoked_')) return 'bg-red-50 text-red-700'
    if (action.startsWith('updated_') || action.startsWith('modified_')) return 'bg-amber-50 text-amber-700'
    if (action.startsWith('created_')) return 'bg-blue-50 text-blue-700'
    return 'bg-gray-50 text-gray-700'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-[#1B4332]">Audit Log</h1>
        <p className="text-gray-500 font-medium">Traceable record of all administrative actions</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
         <div className="flex-1 w-full relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
               type="text" 
               placeholder="Search by admin name..." 
               className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-100 bg-gray-50 text-sm font-medium outline-none focus:border-[#1B4332] transition"
            />
         </div>
         <select className="w-full md:w-48 px-4 py-2.5 rounded-2xl border border-gray-100 bg-gray-50 text-sm font-bold text-gray-700 outline-none focus:border-[#1B4332] transition appearance-none">
            <option value="all">All Actions</option>
            <option value="approved_listing">Approve Listing</option>
            <option value="rejected_listing">Reject Listing</option>
            <option value="verified_landlord">Verify Landlord</option>
            <option value="banned_user">Ban User</option>
            <option value="updated_settings">Update Settings</option>
         </select>
         <button className="px-6 py-2.5 bg-[#1B4332] text-white rounded-2xl text-sm font-black shadow-lg shadow-[#1B4332]/10 hover:brightness-110 active:scale-95 transition">
            Clear Filters
         </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 bg-gray-50/30">
                     <th className="px-8 py-4">Date</th>
                     <th className="px-8 py-4">Admin</th>
                     <th className="px-8 py-4">Action</th>
                     <th className="px-8 py-4">Target Type</th>
                     <th className="px-8 py-4">Details</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50 text-sm">
                  {logs?.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                       <td className="px-8 py-5 text-gray-500 font-medium whitespace-nowrap">{formatDate(log.created_at)}</td>
                       <td className="px-8 py-5 font-bold text-gray-900">{log.admin?.full_name || 'System'}</td>
                       <td className="px-8 py-5">
                          <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap ${getActionColor(log.action)}`}>
                             {log.action.replace(/_/g, ' ').toUpperCase()}
                          </span>
                       </td>
                       <td className="px-8 py-5 text-gray-400 font-bold uppercase text-[10px] tracking-widest">{log.target_type || '-'}</td>
                       <td className="px-8 py-5">
                          <div className="max-w-xs truncate text-gray-600 font-medium" title={JSON.stringify(log.details)}>
                             {log.details ? Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(', ') : '-'}
                          </div>
                       </td>
                    </tr>
                  ))}
                  {!logs?.length && (
                    <tr>
                       <td colSpan={5} className="px-8 py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No audit records found</td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* Pagination */}
      {count && count > pageSize && (
        <div className="flex items-center justify-between px-4">
           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Page {page} of {Math.ceil(count/pageSize)}</p>
           <div className="flex items-center gap-2">
              <button className="p-2 rounded-xl border border-gray-100 bg-white text-gray-400 hover:text-[#1B4332] disabled:opacity-30 transition">
                 <ChevronLeft className="h-5 w-5" />
              </button>
              <button className="p-2 rounded-xl border border-gray-100 bg-white text-gray-400 hover:text-[#1B4332] disabled:opacity-30 transition">
                 <ChevronRight className="h-5 w-5" />
              </button>
           </div>
        </div>
      )}
    </div>
  )
}
