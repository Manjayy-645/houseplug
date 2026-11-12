import { createClient, getAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Home, 
  Users, 
  Star, 
  CreditCard,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Wrench
} from "lucide-react"
import Link from "next/link"
import AppealsList from "@/components/admin/appeals-list"

export default async function AdminDashboardPage() {
  const supabase = createClient()
  const db = getAdminClient()

  // Parallel fetch auth + all overview stats simultaneously
  const [
    authRes,
    { count: pendingListings },
    { count: pendingVerifications },
    { count: pendingServices },
    { count: totalActiveListings },
    { count: totalUsers },
    { data: pendingAppeals },
    { count: activeRoommates },
    { count: totalRoommates }
  ] = await Promise.all([
    supabase.auth.getUser(),
    db.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['landlord', 'agent']).eq('verification_status', 'pending'),
    db.from('service_providers').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('profiles').select('*', { count: 'exact', head: true }),
    db.from('appeals').select('*, user:profiles(full_name, email), ban:bans(reason)').eq('status', 'pending').order('created_at', { ascending: false }).limit(10),
    db.from('roommate_profiles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('roommate_profiles').select('*', { count: 'exact', head: true })
  ])

  const user = authRes.data?.user
  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-black text-[#1B4332]">Welcome back, {user.email?.split('@')[0]}</h1>
        <p className="text-gray-500 font-medium">Here's what's happening on HousePlug today.</p>
      </div>

      {/* Quick Action Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <OverviewCard 
          title="Pending Listings" 
          value={String(pendingListings || 0)} 
          href="/admin/listings?status=pending"
          icon={Clock}
          color="text-amber-600"
          bg="bg-amber-50"
          urgent={!!pendingListings && pendingListings > 0}
        />
        <OverviewCard 
          title="Pending Verifications" 
          value={String(pendingVerifications || 0)} 
          href="/admin/verification"
          icon={ShieldCheck}
          color="text-blue-600"
          bg="bg-blue-50"
          urgent={!!pendingVerifications && pendingVerifications > 0}
        />
        <OverviewCard 
          title="Pending Services" 
          value={String(pendingServices || 0)} 
          href="/admin/services?status=pending"
          icon={Wrench}
          color="text-emerald-700"
          bg="bg-emerald-50"
          urgent={!!pendingServices && pendingServices > 0}
        />
        <OverviewCard 
          title="Active Roommates" 
          value={String(activeRoommates || 0)} 
          href="/admin/roommates"
          icon={Users}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
        <OverviewCard 
          title="Total Users" 
          value={String(totalUsers || 0)} 
          href="/admin/users"
          icon={Users}
          color="text-purple-600"
          bg="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity / Tasks */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Required Actions</h3>
            <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-wider">
               {((pendingListings || 0) + (pendingVerifications || 0) + (pendingServices || 0))} Attention
            </span>
          </div>
          <div className="divide-y divide-gray-50">
             {pendingListings && pendingListings > 0 ? (
               <Link href="/admin/listings?status=pending" className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-4">
                     <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                        <Clock className="h-5 w-5" />
                     </div>
                     <div>
                        <p className="text-sm font-bold text-gray-900">Approve New Listings</p>
                        <p className="text-xs text-gray-400 font-medium">{pendingListings} properties waiting for review</p>
                     </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
               </Link>
             ) : (
                <div className="p-6 flex items-center gap-4 text-emerald-600 opacity-60">
                   <CheckCircle2 className="h-5 w-5" />
                   <p className="text-sm font-bold">All listings have been reviewed</p>
                </div>
             )}

             {pendingVerifications && pendingVerifications > 0 ? (
               <Link href="/admin/verification" className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-4">
                     <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <ShieldCheck className="h-5 w-5" />
                     </div>
                     <div>
                        <p className="text-sm font-bold text-gray-900">Verify Landlords & Agents</p>
                        <p className="text-xs text-gray-400 font-medium">{pendingVerifications} identity documents to check</p>
                     </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
               </Link>
             ) : (
                <div className="p-6 flex items-center gap-4 text-emerald-600 opacity-60">
                   <CheckCircle2 className="h-5 w-5" />
                   <p className="text-sm font-bold">All landlord & agent verifications are up to date</p>
                </div>
             )}

             {pendingServices && pendingServices > 0 ? (
               <Link href="/admin/services?status=pending" className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-4">
                     <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
                        <Wrench className="h-5 w-5" />
                     </div>
                     <div>
                        <p className="text-sm font-bold text-gray-900">Review Campus Services</p>
                        <p className="text-xs text-gray-400 font-medium">{pendingServices} student & vendor service{pendingServices !== 1 ? "s" : ""} waiting for vetting</p>
                     </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
               </Link>
             ) : (
                <div className="p-6 flex items-center gap-4 text-emerald-600 opacity-60">
                   <CheckCircle2 className="h-5 w-5" />
                   <p className="text-sm font-bold">All campus services have been vetted</p>
                </div>
             )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="space-y-6">
           <h3 className="text-lg font-bold text-gray-900 px-2">Common Tasks</h3>
           <div className="grid grid-cols-2 gap-4">
              <QuickLinkCard title="Campus Services" icon={Wrench} href="/admin/services" desc="Directory & Vetting" />
              <QuickLinkCard title="User Support" icon={Users} href="/admin/users" desc="Manage accounts" />
              <QuickLinkCard title="Review Feed" icon={Star} href="/admin/reviews" desc="Moderate comments" />
              <QuickLinkCard title="Billing" icon={CreditCard} href="/admin/subscriptions" desc="View payments" />
              <QuickLinkCard title="Platform" icon={LayoutDashboard} href="/admin/listings" desc="Browse content" />
              <QuickLinkCard title="Roommates" icon={Users} href="/admin/roommates" desc="Manage roommates" />
           </div>

           {profile?.role === 'super_admin' && (
             <Link 
               href="/admin/analytics"
               className="block p-6 rounded-3xl bg-[#1B4332] text-white shadow-xl shadow-emerald-900/20 hover:brightness-110 active:scale-95 transition-all group"
             >
                <div className="flex items-center justify-between mb-4">
                   <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <LayoutDashboard className="h-5 w-5" />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Super Admin Only</span>
                </div>
                <h4 className="text-xl font-black">View Platform Insights</h4>
                <p className="text-white/60 text-sm font-medium mt-1">Check revenue, growth and audit logs.</p>
                <div className="mt-6 flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-widest">
                   Go to dashboard <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
             </Link>
           )}
        </div>
      </div>

      {/* Appeals Section */}
      <div id="appeals" className="pt-2">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Pending Appeals</h3>
        <AppealsList initialAppeals={pendingAppeals as any[]} />
      </div>
    </div>
  )
}

function OverviewCard({ title, value, href, icon: Icon, color, bg, urgent }: any) {
  return (
    <Link 
      href={href}
      className={`p-6 rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all active:scale-95 group relative overflow-hidden`}
    >
      {urgent && <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/10 rounded-bl-full" />}
      <div className={`h-12 w-12 rounded-2xl ${bg} ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{title}</p>
      <h3 className="text-3xl font-black text-gray-900 mt-1">{value}</h3>
    </Link>
  )
}

function QuickLinkCard({ title, icon: Icon, href, desc }: any) {
   return (
      <Link 
        href={href}
        className="p-5 rounded-3xl border border-gray-100 bg-white shadow-sm hover:border-[#1B4332]/20 hover:bg-emerald-50/10 transition-all active:scale-95"
      >
         <Icon className="h-5 w-5 text-gray-400 mb-3" />
         <p className="text-sm font-bold text-gray-900 leading-none">{title}</p>
         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-1">{desc}</p>
      </Link>
   )
}
