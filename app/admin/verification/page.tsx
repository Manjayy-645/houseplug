"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  ExternalLink
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function AdminVerificationPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [verifications, setVerifications] = useState<any[]>([])
  const [tab, setTab] = useState<'pending' | 'verified' | 'rejected' | 'all'>('pending')
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    async function fetchVerifications() {
      setLoading(true)
      let query = supabase
        .from("profiles")
        .select("*")
        .eq("role", "landlord")
      
      if (tab !== 'all') {
        query = query.eq("verification_status", tab)
      } else {
        // For 'all' tab, we want everything that has at least tried to verify or is unverified
        // But usually admin cares about those who have submitted docs.
      }

      const { data, error } = await query.order("created_at", { ascending: false })
      
      if (error) {
        console.error("Error fetching verifications:", error)
      } else {
        setVerifications(data || [])
      }
      setLoading(false)
    }
    fetchVerifications()
  }, [supabase, tab])

  const filteredVerifications = verifications.filter(v => 
    v.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.phone?.includes(searchTerm)
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Verified</span>
      case 'pending':
        return <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700"><Clock className="h-3 w-3" /> Pending</span>
      case 'rejected':
        return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-700"><XCircle className="h-3 w-3" /> Rejected</span>
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-bold text-gray-700">Unverified</span>
    }
  }

  return (
    <div className="p-6 lg:p-10 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-[#1B4332]" />
            Landlord Verifications
          </h1>
          <p className="text-gray-600">Review and manage landlord identity verifications.</p>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto">
          {(['pending', 'verified', 'rejected', 'all'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition ${
                tab === t ? "bg-white text-[#1B4332] shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search landlord..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#1B4332]/20 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500">Landlord</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500">ID Type</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500">Submitted</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#1B4332] mx-auto" />
                  </td>
                </tr>
              ) : filteredVerifications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No verifications found in this category.
                  </td>
                </tr>
              ) : (
                filteredVerifications.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{v.full_name}</span>
                        <span className="text-xs text-gray-500">{v.email}</span>
                        <span className="text-xs text-gray-500">{v.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold uppercase text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {v.id_document_type?.replace('_', ' ') || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(v.verification_status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                       {v.verification_status !== 'unverified' ? new Date(v.updated_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <Link 
                        href={`/admin/verification/${v.id}`}
                        className="flex items-center gap-2 text-xs font-bold text-[#1B4332] hover:underline"
                      >
                        <Eye className="h-4 w-4" /> Review
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
