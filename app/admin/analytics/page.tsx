import { createClient } from "@/lib/supabase/server"
import { formatDate } from "@/lib/utils"
import { Users, Landmark, Home, Globe } from "lucide-react"

import { GrowthChart } from "@/components/admin/growth-chart"
import { UniversityPieChart } from "@/components/admin/university-pie-chart"

export default async function AnalyticsPage() {
  const supabase = createClient()

  // Parallel fetch for stats and raw data for aggregation
  const [
    { count: studentCount },
    { count: landlordCount },
    { count: activeListingsCount },
    { data: mostViewed },
    { data: allProfiles },
    { data: allListings }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'landlord'),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('listings').select('title, university, views_count, landlord:profiles(full_name)').order('views_count', { ascending: false }).limit(5),
    supabase.from('profiles').select('created_at, role'),
    supabase.from('listings').select('university, room_type').eq('status', 'active')
  ])

  // Real data aggregation for Weekly Growth (Last 8 weeks)
  const now = new Date()
  const last8Weeks = Array.from({ length: 8 }, (_, i) => {
    const d = new Date()
    d.setDate(now.getDate() - (7 * (7 - i)))
    // Get start of week
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const startOfWeek = new Date(d.setDate(diff))
    return {
      start: startOfWeek,
      name: `${startOfWeek.getDate()}/${startOfWeek.getMonth() + 1}`,
      students: 0,
      landlords: 0
    }
  })

  allProfiles?.forEach(p => {
    const d = new Date(p.created_at)
    const weekIndex = last8Weeks.findIndex((w, i) => {
      const nextWeek = i < 7 ? last8Weeks[i+1].start : now
      return d >= w.start && d < nextWeek
    })
    if (weekIndex !== -1) {
      if (p.role === 'student') last8Weeks[weekIndex].students++
      if (p.role === 'landlord') last8Weeks[weekIndex].landlords++
    }
  })

  // Real data aggregation for Listings by University
  const uniCountMap: Record<string, number> = {}
  allListings?.forEach(l => {
    uniCountMap[l.university] = (uniCountMap[l.university] || 0) + 1
  })
  const uniData = Object.entries(uniCountMap).map(([name, value]) => ({ name, value }))

  // Real data aggregation for Listings by Room Type
  const roomTypeMap: Record<string, number> = { 'self_con': 0, '1_bedroom': 0, '2_bedroom': 0, 'shared': 0 }
  allListings?.forEach(l => {
    roomTypeMap[l.room_type] = (roomTypeMap[l.room_type] || 0) + 1
  })
  const roomTypeData = [
    { label: 'Self-con', count: roomTypeMap['self_con'] || 0, color: 'bg-emerald-500' },
    { label: '1-Bedroom', count: roomTypeMap['1_bedroom'] || 0, color: 'bg-blue-500' },
    { label: '2-Bedroom', count: roomTypeMap['2_bedroom'] || 0, color: 'bg-purple-500' },
    { label: 'Shared', count: roomTypeMap['shared'] || 0, color: 'bg-amber-500' }
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-[#1B4332]">Platform Analytics</h1>
        <p className="text-gray-500 font-medium">Detailed usage statistics and growth metrics</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Students" value={String(studentCount || 0)} icon={Users} color="bg-blue-500" />
        <StatsCard title="Total Landlords" value={String(landlordCount || 0)} icon={Landmark} color="bg-amber-500" />
        <StatsCard title="Active Listings" value={String(activeListingsCount || 0)} icon={Home} color="bg-emerald-500" />
        <StatsCard title="Universities" value={String(uniData.length)} icon={Globe} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Listings by University</h3>
            {uniData.length > 0 ? (
              <UniversityPieChart data={uniData} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400 font-bold uppercase text-xs tracking-widest">No listings found</div>
            )}
         </div>

         <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Weekly Growth</h3>
            <GrowthChart data={last8Weeks} />
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Top Viewed Listings */}
         <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50">
               <h3 className="text-lg font-bold text-gray-900">Most Viewed Listings</h3>
            </div>
            <div className="divide-y divide-gray-50">
               {mostViewed?.length ? mostViewed.map((l, i) => (
                 <div key={i} className="px-8 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                       <span className="text-lg font-black text-gray-200">#{i+1}</span>
                       <div>
                          <p className="text-sm font-bold text-gray-900 leading-none">{l.title}</p>
                          <p className="text-[11px] text-gray-400 mt-1 uppercase font-bold tracking-wider">{l.university} &middot; By {l.landlord?.full_name}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-[#1B4332]">{l.views_count.toLocaleString()}</p>
                       <p className="text-[10px] font-black text-gray-400 uppercase">Views</p>
                    </div>
                 </div>
               )) : (
                 <div className="p-8 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No views recorded yet</div>
               )}
            </div>
         </div>

         {/* Listings by Room Type */}
         <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Listings by Room Type</h3>
            <div className="space-y-6">
               {roomTypeData.map((item) => (
                 <div key={item.label}>
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest text-gray-400 mb-2">
                       <span>{item.label}</span>
                       <span className="text-gray-900">{item.count}</span>
                    </div>
                    <div className="h-4 bg-gray-50 rounded-full overflow-hidden p-1">
                       <div className={`h-full rounded-full ${item.color}`} style={{ width: `${activeListingsCount > 0 ? (item.count / activeListingsCount) * 100 : 0}%` }}></div>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  )
}

function StatsCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-4">
      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white ${color} shadow-lg shadow-current/10`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{title}</p>
        <h3 className="text-3xl font-black text-gray-900 mt-0.5">{value}</h3>
      </div>
    </div>
  )
}

function LegendItem({ color, label }: any) {
   return (
      <div className="flex items-center gap-2">
         <div className={`h-2.5 w-2.5 rounded-full ${color}`}></div>
         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
      </div>
   )
}
