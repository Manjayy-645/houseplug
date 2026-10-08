"use client"

import { useState, useEffect, useCallback } from "react"
import { Building, Award, Key, Search, Download, School } from "lucide-react"
import { fetchUniversityRequestsSummary, exportUniversityWaitlistContacts, type UniversityRequestSummary } from "@/app/actions/admin-university-requests"
import { formatDate } from "@/lib/utils"

export function UniversityDemandTable() {
  const [data, setData] = useState<UniversityRequestSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [error, setError] = useState("")

  const loadData = useCallback(async (query: string) => {
    setLoading(true)
    const { data: resData, error: err } = await fetchUniversityRequestsSummary(query)
    if (err) setError(err)
    if (resData) setData(resData)
    setLoading(false)
  }, [])

  useEffect(() => {
    const handler = setTimeout(() => {
      loadData(search)
    }, 300)
    return () => clearTimeout(handler)
  }, [search, loadData])

  const handleExport = async (universityName: string) => {
    const { csv, error: err } = await exportUniversityWaitlistContacts(universityName)
    if (err) {
      alert(err)
      return
    }
    if (csv) {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `${universityName.replace(/\s+/g, "_")}_waitlist.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const totalRequests = data.reduce((acc, row) => acc + row.total_requests, 0)
  const landlordRequests = data.reduce((acc, row) => acc + row.landlord_requests, 0)
  const topCampus = data.length > 0 ? data[0].normalized_name : "None"

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campus Expansion Demand</h1>
          <p className="text-sm text-gray-500 mt-1">Aggregated student and landlord waitlist requests from the search combobox.</p>
        </div>
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search institution..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <Building className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Requests</p>
            <p className="text-2xl font-black text-gray-900">{totalRequests}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 text-[#10B981]" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Top Campus</p>
            <p className="text-xl font-bold text-gray-900 truncate max-w-[150px]">{topCampus}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#F59E0B]/10 flex items-center justify-center shrink-0">
            <Key className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Landlord Supply</p>
            <p className="text-2xl font-black text-gray-900">{landlordRequests}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-700 text-xs font-semibold uppercase border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Rank &amp; Institution</th>
                <th className="px-6 py-4">Total Votes</th>
                <th className="px-6 py-4">Split (Students vs Landlords)</th>
                <th className="px-6 py-4">Top Areas Reported</th>
                <th className="px-6 py-4">Last Activity</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Loading requests...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <School className="w-10 h-10 text-gray-300" />
                      <p>No external campus requests recorded yet.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => {
                  const maxRequests = data[0]?.total_requests || 1
                  const widthPct = Math.max(5, (row.total_requests / maxRequests) * 100)
                  
                  return (
                    <tr key={row.normalized_name} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                            #{idx + 1}
                          </span>
                          <span className="font-semibold text-gray-900">{row.normalized_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-900 w-8">{row.total_requests}</span>
                          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#1B4332]" style={{ width: `${widthPct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-[#1B4332]">
                            {row.student_requests} students
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-[#F59E0B]">
                            {row.landlord_requests} landlords
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {(row.reported_areas || []).slice(0, 2).map((area, i) => (
                            <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium">
                              {area}
                            </span>
                          ))}
                          {(row.reported_areas?.length || 0) > 2 && (
                            <span className="text-xs font-medium text-gray-400">
                              +{(row.reported_areas?.length || 0) - 2} more
                            </span>
                          )}
                          {(!row.reported_areas || row.reported_areas.length === 0) && (
                            <span className="text-gray-400 italic text-xs">Unknown</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {formatDate(row.last_requested_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleExport(row.normalized_name)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg text-xs font-semibold shadow-sm transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Export Contacts
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
