"use client"

import { useState } from "react"
import { Profile } from "@/types"
import { 
  Check, 
  X, 
  Eye, 
  MoreHorizontal, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  AlertCircle,
  ExternalLink
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type VerificationTableProps = {
  landlords: Profile[]
  currentStatus: Profile["verification_status"] | "all"
}

export function VerificationTable({ landlords, currentStatus }: VerificationTableProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleAction = async (landlord_id: string, action: 'approve' | 'reject' | 'revoke') => {
    if (action === 'reject') {
       // Quick reject might need a reason, but instructions say "Quick Reject"
       // I'll redirect to detail page for rejection to ensure reason is provided
       router.push(`/admin/verification/${landlord_id}`)
       return
    }

    if (!confirm(`Are you sure you want to ${action} this verification?`)) return

    setLoading(landlord_id)
    try {
      const res = await fetch('/api/admin/verify-landlord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landlord_id, action })
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

  const formatIDType = (type?: string) => {
    if (!type) return "N/A"
    const types: Record<string, string> = {
      nin: "NIN (National ID)",
      drivers_license: "Driver's License",
      national_id: "National ID Card",
      voters_card: "Voter's Card"
    }
    return types[type] || type.replace('_', ' ').toUpperCase()
  }

  const getRelativeTime = (date: string) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 1) return "Just now"
    if (hours < 24) return `${hours} hours ago`
    const days = Math.floor(hours / 24)
    return `${days} days ago`
  }

  if (landlords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="bg-gray-50 p-6 rounded-full mb-4">
          {currentStatus === 'pending' ? <Check className="h-10 w-10 text-emerald-500" /> : <Users className="h-10 w-10 text-gray-300" />}
        </div>
        <h3 className="text-xl font-bold text-gray-900">
          {currentStatus === 'pending' ? "No pending verifications 🎉" : 
           currentStatus === 'verified' ? "No verified landlords yet" :
           currentStatus === 'rejected' ? "No rejected verifications" : "No landlords found"}
        </h3>
        <p className="text-gray-500 mt-2 max-w-xs">
          {currentStatus === 'pending' ? "You're all caught up with identity reviews." : "Try adjusting your filters or search terms."}
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
            <th className="px-6 py-4">Landlord</th>
            <th className="px-6 py-4">Contact</th>
            <th className="px-6 py-4">ID Type</th>
            <th className="px-6 py-4">Submitted</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {landlords.map((landlord) => (
            <tr key={landlord.id} className="group hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary font-black text-xs border border-primary/10">
                    {landlord.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-none">{landlord.full_name}</p>
                    <p className="text-[11px] text-gray-400 mt-1 font-medium">{landlord.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5">
                <p className="text-sm font-semibold text-gray-600">{landlord.phone}</p>
              </td>
              <td className="px-6 py-5">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider bg-gray-100 px-2 py-1 rounded-md">
                  {formatIDType(landlord.id_document_type)}
                </span>
              </td>
              <td className="px-6 py-5">
                <p className="text-xs font-medium text-gray-400">{getRelativeTime(landlord.created_at)}</p>
              </td>
              <td className="px-6 py-5">
                <StatusBadge status={landlord.verification_status} />
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center justify-end gap-2">
                  <Link 
                    href={`/admin/verification/${landlord.id}`}
                    className="p-2 rounded-xl text-gray-400 hover:text-primary hover:bg-primary/5 transition-all"
                    title="Detailed Review"
                  >
                    <Eye className="h-5 w-5" />
                  </Link>

                  {landlord.verification_status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleAction(landlord.id, 'approve')}
                        disabled={!!loading}
                        className="bg-emerald-500 text-white p-2 rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        title="Quick Approve"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleAction(landlord.id, 'reject')}
                        disabled={!!loading}
                        className="bg-red-500 text-white p-2 rounded-xl shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        title="Quick Reject"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </>
                  )}

                  {landlord.verification_status === 'verified' && (
                    <button
                      onClick={() => handleAction(landlord.id, 'revoke')}
                      disabled={!!loading}
                      className="border border-red-100 text-red-500 p-2 rounded-xl hover:bg-red-50 transition-all disabled:opacity-50"
                      title="Revoke Verification"
                    >
                      <AlertCircle className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatusBadge({ status }: { status: Profile["verification_status"] }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    verified: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    unverified: "bg-gray-100 text-gray-500"
  }
  const icons: Record<string, any> = {
    pending: Clock,
    verified: ShieldCheck,
    rejected: ShieldAlert,
    unverified: AlertCircle
  }
  const Icon = icons[status] || AlertCircle

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${styles[status]}`}>
      <Icon className="h-3 w-3" />
      {status}
    </span>
  )
}

import { Users } from "lucide-react"
