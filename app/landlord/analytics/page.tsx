import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { hasProAccess } from "@/lib/billing"
import { BarChart3, Users, MousePointerClick, MessageSquare, Lock } from "lucide-react"

type Stat = {
  name: string
  value: number | string
  icon: typeof BarChart3
  color: string
  desc: string
}

function StatCard({ stat }: { stat: Stat }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`rounded-lg bg-gray-50 p-3 ${stat.color}`}>
          <stat.icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.name}</p>
          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-400">{stat.desc}</p>
    </div>
  )
}

export default async function LandlordAnalyticsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: listings }, { count: reviewCount }, isPro] = await Promise.all([
    supabase
      .from("listings")
      .select("id, title, views_count, whatsapp_clicks, status")
      .eq("landlord_id", user?.id)
      .order("views_count", { ascending: false }),
    supabase
      .from("reviews")
      .select("*, listings!inner(landlord_id)", { count: "exact", head: true })
      .eq("listings.landlord_id", user?.id),
    user ? hasProAccess(user.id) : Promise.resolve(false),
  ])

  const totalViews = listings?.reduce((sum, item) => sum + (item.views_count || 0), 0) || 0
  const totalClicks = listings?.reduce((sum, item) => sum + (item.whatsapp_clicks || 0), 0) || 0

  const engagement = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0"

  // Total Views is the free teaser; everything else is Pro-only.
  const teaser: Stat = { name: "Total Room Views", value: totalViews, icon: MousePointerClick, color: "text-blue-600", desc: "Total times your rooms were seen" }
  const gatedStats: Stat[] = [
    { name: "WhatsApp Clicks", value: totalClicks, icon: Users, color: "text-green-600", desc: "Potential leads/contacts" },
    { name: "Reviews Received", value: reviewCount || 0, icon: MessageSquare, color: "text-purple-600", desc: "Student feedback count" },
    { name: "Avg. Engagement", value: `${engagement}%`, icon: BarChart3, color: "text-orange-600", desc: "Views to contact ratio" },
  ]

  const detailed = (
    <div className="space-y-10">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {gatedStats.map((stat) => (
          <StatCard key={stat.name} stat={stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Performance Breakdown</h2>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-600">Room Title</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Views</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Clicks</th>
                    <th className="px-6 py-4 font-semibold text-gray-600">Conv.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {listings?.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{l.title}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          l.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{l.views_count}</td>
                      <td className="px-6 py-4 text-gray-600">{l.whatsapp_clicks}</td>
                      <td className="px-6 py-4 font-semibold text-[#1B4332]">
                        {l.views_count > 0 ? ((l.whatsapp_clicks / l.views_count) * 100).toFixed(0) : 0}%
                      </td>
                    </tr>
                  ))}
                  {(!listings || listings.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-400">No active listings to analyze</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Growth Tips</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
              <h3 className="text-sm font-bold text-amber-800">Improve Conversion</h3>
              <p className="mt-1 text-xs text-amber-700 leading-relaxed">
                If your views are high but clicks are low, consider adding more photos or adjusting your price. Students often click when they see at least 4 clear photos.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50">
              <h3 className="text-sm font-bold text-emerald-800">Boost Visibility</h3>
              <p className="mt-1 text-xs text-emerald-700 leading-relaxed">
                Listings with the "Featured" badge get up to 3x more views. Check your subscription plan to unlock more featured slots.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50">
              <h3 className="text-sm font-bold text-blue-800">Review Impact</h3>
              <p className="mt-1 text-xs text-blue-700 leading-relaxed">
                Higher ratings improve student trust. Encourage happy tenants to leave a review after they move in.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )

  return (
    <div className="p-6 lg:p-10 space-y-10">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Analytics & Insights</h1>
        <p className="mt-1 text-sm text-gray-500">Track how your listings are performing and discover areas for improvement.</p>
      </header>

      {/* Total views — visible to everyone as a teaser */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard stat={teaser} />
      </div>

      {isPro ? (
        detailed
      ) : (
        <div className="relative">
          <div className="blur-sm pointer-events-none select-none" aria-hidden="true">
            {detailed}
          </div>
          <div className="absolute inset-0 flex items-start justify-center px-4 pt-16">
            <div className="max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-xl">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1B4332]/10">
                <Lock className="h-6 w-6 text-[#1B4332]" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">Unlock full analytics with Pro</h3>
              <p className="mt-2 text-sm text-gray-500">
                See contacts, trends, and per-listing performance for every room you list.
              </p>
              <Link
                href="/landlord/subscription"
                className="mt-5 inline-block rounded-xl bg-[#F59E0B] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-110 active:scale-95"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
