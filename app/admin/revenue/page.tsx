import { createClient } from "@/lib/supabase/server"
import { formatNaira, formatDate } from "@/lib/utils"
import { CreditCard, TrendingUp, Users, Crown, BarChart2 } from "lucide-react"
// Note: In a real environment, you'd need to install recharts. 
// For this task, I'll assume it's available or use a simplified chart representation if not.
// The instructions say "Use recharts BarChart".

import { RevenueChart } from "@/components/admin/revenue-chart"

export default async function RevenuePage() {
  const supabase = createClient()

  // Fetch in parallel
  const [
    { data: payments },
    { count: proCount },
    { count: businessCount },
  ] = await Promise.all([
    supabase.from('payments').select('*').order('created_at', { ascending: false }),
    supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('plan', 'pro').eq('active', true),
    supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('plan', 'business').eq('active', true),
  ])

  const totalRevenue = payments?.filter(p => p.status === 'success').reduce((acc, p) => acc + p.amount, 0) || 0
  
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const thisMonthRevenue = payments?.filter(p => p.status === 'success' && p.created_at >= thisMonthStart).reduce((acc, p) => acc + p.amount, 0) || 0

  // Real data aggregation for Monthly Revenue (Last 6 months)
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(now.getMonth() - (5 - i))
    return {
      month: d.getMonth(),
      year: d.getFullYear(),
      name: d.toLocaleString('default', { month: 'short' }),
      amount: 0
    }
  })

  payments?.forEach(p => {
    if (p.status !== 'success') return
    const d = new Date(p.created_at)
    const monthIndex = last6Months.findIndex(m => m.month === d.getMonth() && m.year === d.getFullYear())
    if (monthIndex !== -1) {
      last6Months[monthIndex].amount += (p.amount / 100)
    }
  })

  // Real data aggregation for University Revenue
  const uniRevenueMap: Record<string, number> = { 'UniPort': 0, 'RSU': 0, 'IAUE': 0, 'KenPoly': 0 }
  
  // Fetch successful payments with their listing or landlord info
  const { data: allSuccessfulPayments } = await supabase
    .from('payments')
    .select('amount, listing_id, landlord_id, listing:listings(university)')
    .eq('status', 'success')

  // To handle payments without listing_id (like subscriptions), 
  // we'll need a mapping of landlords to their primary university
  const { data: landlordUnis } = await supabase
    .from('listings')
    .select('landlord_id, university')
    .order('created_at', { ascending: false })

  const landlordUniMap: Record<string, string> = {}
  landlordUnis?.forEach(l => {
    if (!landlordUniMap[l.landlord_id]) {
      landlordUniMap[l.landlord_id] = l.university
    }
  })

  allSuccessfulPayments?.forEach((p: any) => {
    const university = p.listing?.university || landlordUniMap[p.landlord_id]
    if (university && uniRevenueMap.hasOwnProperty(university)) {
      uniRevenueMap[university] += (p.amount / 100)
    }
  })

  const universityRevenue = Object.entries(uniRevenueMap).map(([name, amount]) => ({
    name,
    amount,
    color: name === 'UniPort' ? 'bg-emerald-500' : name === 'RSU' ? 'bg-amber-500' : name === 'IAUE' ? 'bg-blue-500' : 'bg-purple-500'
  })).sort((a, b) => b.amount - a.amount)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-[#1B4332]">Revenue Dashboard</h1>
        <p className="text-gray-500 font-medium">Platform financial performance and transactions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Revenue" 
          value={formatNaira(totalRevenue / 100)} 
          subtitle="All-time earnings"
          icon={DollarSign}
          color="bg-emerald-500"
        />
        <StatsCard 
          title="This Month" 
          value={formatNaira(thisMonthRevenue / 100)} 
          subtitle="Current month revenue"
          icon={TrendingUp}
          color="bg-blue-500"
        />
        <StatsCard 
          title="Active Pro" 
          value={String(proCount || 0)} 
          subtitle="₦5k/mo subscribers"
          icon={Crown}
          color="bg-amber-500"
        />
        <StatsCard 
          title="Active Business" 
          value={String(businessCount || 0)} 
          subtitle="₦15k/mo subscribers"
          icon={BarChart2}
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Monthly Revenue</h3>
          <RevenueChart data={last6Months} />
        </div>

        {/* Revenue by University */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
           <h3 className="text-lg font-bold text-gray-900 mb-6">By University</h3>
           <div className="space-y-4">
              {universityRevenue.map((u) => (
                <div key={u.name}>
                   <div className="flex justify-between text-sm font-bold mb-1.5">
                      <span className="text-gray-700">{u.name}</span>
                      <span className="text-[#1B4332]">{formatNaira(u.amount)}</span>
                   </div>
                   <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${u.color}`} style={{ width: `${totalRevenue > 0 ? (u.amount / (totalRevenue/100)) * 100 : 0}%` }} />
                   </div>
                </div>
              ))}
              {universityRevenue.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No university data yet</p>}
           </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
         <div className="p-8 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
            <button className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition">View All</button>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 bg-gray-50/30">
                     <th className="px-8 py-4">Date</th>
                     <th className="px-8 py-4">Type</th>
                     <th className="px-8 py-4">Plan</th>
                     <th className="px-8 py-4">Amount</th>
                     <th className="px-8 py-4">Status</th>
                     <th className="px-8 py-4">Reference</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {payments?.slice(0, 30).map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                       <td className="px-8 py-4 text-sm font-bold text-gray-900">{formatDate(p.created_at)}</td>
                       <td className="px-8 py-4 text-sm font-semibold text-gray-500 capitalize">{p.type}</td>
                       <td className="px-8 py-4 text-sm font-semibold text-gray-500 capitalize">{p.plan || '-'}</td>
                       <td className="px-8 py-4 text-sm font-black text-[#1B4332]">{formatNaira(p.amount / 100)}</td>
                       <td className="px-8 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                             p.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                             p.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                             'bg-red-100 text-red-700'
                          }`}>
                             {p.status}
                          </span>
                       </td>
                       <td className="px-8 py-4 text-xs font-mono text-gray-400">{p.paystack_reference}</td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  )
}

function StatsCard({ title, value, subtitle, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-5 group hover:shadow-md transition-shadow">
      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-white ${color} shadow-lg shadow-current/10 group-hover:scale-110 transition-transform`}>
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{title}</p>
        <h3 className="text-2xl font-black text-gray-900 mt-0.5">{value}</h3>
        <p className="text-[11px] text-gray-400 font-bold mt-1">{subtitle}</p>
      </div>
    </div>
  )
}

import { DollarSign } from "lucide-react"
