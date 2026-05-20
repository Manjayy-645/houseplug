"use client"

import { useState } from "react"
import { Download, Loader2, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export function ExportButton({ type }: { type: string }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleExport = async () => {
    setLoading(true)
    setSuccess(false)

    try {
      let data: any[] = []
      let filename = `houseplug-${type}-${new Date().toISOString().split('T')[0]}.csv`

      switch (type) {
        case 'users':
          const { data: users } = await supabase.from('profiles').select('full_name, email, phone, role, university, verification_status, created_at')
          data = users || []
          break
        case 'listings':
          const { data: listings } = await supabase.from('listings').select('title, area, university, price_yearly, room_type, status, views_count, created_at')
          data = listings || []
          break
        case 'payments':
          const { data: payments } = await supabase.from('payments').select('created_at, type, plan, billing_cycle, amount, status, paystack_reference')
          data = payments || []
          break
        case 'reviews':
          const { data: reviews } = await supabase.from('reviews').select('listing_id, rating, comment, reply, created_at')
          data = reviews || []
          break
      }

      if (data.length > 0) {
        exportToCSV(data, filename)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        alert("No data found to export.")
      }
    } catch (error) {
      console.error("Export failed:", error)
      alert("Export failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row => 
      Object.values(row)
        .map(val => `"${String(val ?? '').replace(/"/g, '""')}"`)
        .join(',')
    ).join('\n')
    const csv = `${headers}\n${rows}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all ${
        success 
          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
          : 'bg-[#1B4332] text-white shadow-lg shadow-[#1B4332]/10 hover:brightness-110 active:scale-95'
      } disabled:opacity-50`}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : success ? <CheckCircle2 className="h-5 w-5" /> : <Download className="h-5 w-5" />}
      {success ? 'Exported!' : 'Export CSV'}
    </button>
  )
}
