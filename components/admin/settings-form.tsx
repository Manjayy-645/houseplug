"use client"

import { useState } from "react"
import { Save, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function SettingsForm({ settings }: { settings: Record<string, any> }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSave = async (section: string, data: Record<string, any>) => {
    setLoading(section)
    setSuccess(null)

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, settings: data })
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      
      setSuccess(section)
      setTimeout(() => setSuccess(null), 3000)
      router.refresh()
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-8 pb-24">
      {/* SUBSCRIPTION PRICING */}
      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50">
           <h3 className="text-lg font-bold text-gray-900">Subscription Pricing</h3>
           <p className="text-sm text-gray-500 mt-1 font-medium">Monthly rates for platform plans</p>
        </div>
        <div className="p-8 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PriceInput label="Pro Plan (Monthly)" value={settings.pro_plan_price} name="pro_plan_price" />
              <PriceInput label="Business Plan (Monthly)" value={settings.business_plan_price} name="business_plan_price" />
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PriceInput label="Verification Fee" value={settings.verification_fee} name="verification_fee" />
              <div className="flex items-center bg-blue-50/50 p-4 rounded-2xl gap-3 border border-blue-100">
                 <AlertTriangle className="h-5 w-5 text-blue-500 shrink-0" />
                 <p className="text-[11px] font-bold text-blue-700 leading-relaxed uppercase tracking-wider">
                    Annual price is calculated as monthly × 9 automatically.
                 </p>
              </div>
           </div>
           <div className="pt-4 flex justify-end">
              <SaveButton 
                section="pricing" 
                loading={loading === 'pricing'} 
                success={success === 'pricing'}
                onClick={() => {
                   const pro = (document.getElementsByName('pro_plan_price')[0] as HTMLInputElement).value
                   const business = (document.getElementsByName('business_plan_price')[0] as HTMLInputElement).value
                   const verification = (document.getElementsByName('verification_fee')[0] as HTMLInputElement).value
                   handleSave('pricing', { 
                     pro_plan_price: Number(pro), 
                     business_plan_price: Number(business),
                     verification_fee: Number(verification)
                   })
                }}
              />
           </div>
        </div>
      </section>

      {/* BOOST PRICING */}
      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50">
           <h3 className="text-lg font-bold text-gray-900">Boost Pricing</h3>
           <p className="text-sm text-gray-500 mt-1 font-medium">Pricing for visibility enhancements</p>
        </div>
        <div className="p-8 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <PriceInput label="Featured (7d)" value={settings.boost_featured_7} name="boost_featured_7" />
              <PriceInput label="Featured (30d)" value={settings.boost_featured_30} name="boost_featured_30" />
              <PriceInput label="Urgent Tag" value={settings.boost_urgent} name="boost_urgent" />
              <PriceInput label="Refresh Now" value={settings.boost_refresh} name="boost_refresh" />
           </div>
           <div className="pt-4 flex justify-end">
              <SaveButton 
                section="boosts" 
                loading={loading === 'boosts'} 
                success={success === 'boosts'}
                onClick={() => {
                   const f7 = (document.getElementsByName('boost_featured_7')[0] as HTMLInputElement).value
                   const f30 = (document.getElementsByName('boost_featured_30')[0] as HTMLInputElement).value
                   const urgent = (document.getElementsByName('boost_urgent')[0] as HTMLInputElement).value
                   const refresh = (document.getElementsByName('boost_refresh')[0] as HTMLInputElement).value
                   handleSave('boosts', { 
                     boost_featured_7: Number(f7), 
                     boost_featured_30: Number(f30),
                     boost_urgent: Number(urgent),
                     boost_refresh: Number(refresh)
                   })
                }}
              />
           </div>
        </div>
      </section>

      {/* LISTING LIMITS */}
      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50">
           <h3 className="text-lg font-bold text-gray-900">Listing Limits</h3>
           <p className="text-sm text-gray-500 mt-1 font-medium">Max active listings per plan</p>
        </div>
        <div className="p-8 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Free Plan Max</label>
                 <input 
                    type="number" 
                    name="max_free_listings"
                    defaultValue={settings.max_free_listings}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 font-bold outline-none focus:border-[#1B4332]"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Pro Plan Max</label>
                 <input 
                    type="number" 
                    name="max_pro_listings"
                    defaultValue={settings.max_pro_listings}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 font-bold outline-none focus:border-[#1B4332]"
                 />
              </div>
           </div>
           <p className="text-xs font-bold text-gray-400 uppercase tracking-wider italic">* Business plan always has unlimited listings.</p>
           <div className="pt-4 flex justify-end">
              <SaveButton 
                section="limits" 
                loading={loading === 'limits'} 
                success={success === 'limits'}
                onClick={() => {
                   const free = (document.getElementsByName('max_free_listings')[0] as HTMLInputElement).value
                   const pro = (document.getElementsByName('max_pro_listings')[0] as HTMLInputElement).value
                   handleSave('limits', { 
                     max_free_listings: Number(free), 
                     max_pro_listings: Number(pro)
                   })
                }}
              />
           </div>
        </div>
      </section>

      {/* MAINTENANCE MODE */}
      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50">
           <h3 className="text-lg font-bold text-gray-900">Maintenance Mode</h3>
           <p className="text-sm text-gray-500 mt-1 font-medium">Emergency system status control</p>
        </div>
        <div className="p-8 space-y-6">
           <div className="flex items-center justify-between p-6 rounded-3xl bg-red-50 border border-red-100">
              <div className="flex items-center gap-4">
                 <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-colors ${settings.maintenance_mode === 'true' ? 'bg-red-500 text-white' : 'bg-white text-red-500 border border-red-100'}`}>
                    <AlertTriangle className="h-6 w-6" />
                 </div>
                 <div>
                    <p className="text-sm font-bold text-red-900">System Visibility</p>
                    <p className="text-xs font-medium text-red-700/70 mt-0.5">
                       {settings.maintenance_mode === 'true' ? 'Site is currently locked for maintenance.' : 'Site is live and accessible to all users.'}
                    </p>
                 </div>
              </div>
              <button 
                 onClick={() => {
                    if (confirm(`Are you sure you want to ${settings.maintenance_mode === 'true' ? 'DISABLE' : 'ENABLE'} maintenance mode?`)) {
                       handleSave('maintenance', { maintenance_mode: settings.maintenance_mode === 'true' ? 'false' : 'true' })
                    }
                 }}
                 className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${
                   settings.maintenance_mode === 'true' 
                     ? 'bg-red-500 text-white hover:brightness-110' 
                     : 'border border-red-200 text-red-500 hover:bg-red-100'
                 }`}
              >
                 {settings.maintenance_mode === 'true' ? 'Disable Maintenance' : 'Enable Maintenance'}
              </button>
           </div>
        </div>
      </section>
    </div>
  )
}

function PriceInput({ label, value, name }: any) {
   return (
      <div className="space-y-2">
         <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{label}</label>
         <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">₦</span>
            <input 
               type="number" 
               name={name}
               defaultValue={value}
               className="w-full pl-8 pr-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 font-bold outline-none focus:border-[#1B4332]"
            />
         </div>
      </div>
   )
}

function SaveButton({ section, loading, success, onClick }: any) {
   return (
      <button 
        onClick={onClick}
        disabled={loading}
        className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-black transition-all shadow-lg ${
          success 
            ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
            : 'bg-[#1B4332] text-white shadow-[#1B4332]/20 hover:brightness-110 active:scale-95'
        } disabled:opacity-50`}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : success ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        {success ? 'Saved!' : 'Save Changes'}
      </button>
   )
}
