"use client"

import { Profile } from "@/types"
import { ShieldCheck, UserMinus, Crown } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function AdminList({ admins }: { admins: Profile[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleRevoke = async (admin: Profile) => {
    if (admin.role === 'super_admin') {
      alert("Cannot revoke super admin permissions via UI.")
      return
    }

    if (!confirm(`Are you sure you want to revoke admin permissions for ${admin.full_name}?`)) return

    setLoading(admin.id)
    try {
      const res = await fetch('/api/admin/manage-admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke', userId: admin.id })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.refresh()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="divide-y divide-gray-50">
      {admins.map((admin) => (
        <div key={admin.id} className="px-8 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
               {admin.full_name[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                 <p className="text-sm font-bold text-gray-900">{admin.full_name}</p>
                 {admin.role === 'super_admin' && (
                    <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                       <Crown className="h-2.5 w-2.5" /> Super
                    </span>
                 )}
              </div>
              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">{admin.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Added</p>
                <p className="text-[11px] font-bold text-gray-900">{new Date(admin.created_at).toLocaleDateString()}</p>
             </div>
             <button
               onClick={() => handleRevoke(admin)}
               disabled={admin.role === 'super_admin' || loading === admin.id}
               className={`p-2 rounded-xl transition-all ${
                 admin.role === 'super_admin' 
                   ? 'text-gray-200 cursor-not-allowed' 
                   : 'text-red-400 hover:text-red-600 hover:bg-red-50'
               }`}
               title={admin.role === 'super_admin' ? "Super Admin cannot be revoked" : "Revoke Admin Access"}
             >
               <UserMinus className="h-5 w-5" />
             </button>
          </div>
        </div>
      ))}
    </div>
  )
}
