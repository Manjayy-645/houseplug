"use client"

import { useState, useEffect } from "react"
import { Save, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function SettingsForm({ settings: initialSettings }: { settings: Record<string, any> }) {
  const router = useRouter()
  const [settings, setSettings] = useState(initialSettings)
  const [loading, setLoading] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Update local state when initialSettings change (e.g. after a save and refresh)
  useEffect(() => {
    setSettings(initialSettings)
  }, [initialSettings])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setSettings(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }))
  }

  const handleSave = async (section: string, keys: string[]) => {
    setLoading(section)
    setSuccess(null)

    const data: Record<string, any> = {}
    keys.forEach(key => {
      data[key] = settings[key]
    })

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
           <p className="text-sm text-gray-500 mt-1 font-medium">Monthly rates for platform plans (in Kobo, e.g. 500000 = ₦5,000)</p>
        </div>
        <div className="p-8 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PriceInput 
                label="Pro Plan (Monthly)" 
                value={settings.pro_plan_price} 
                name="pro_plan_price" 
                onChange={handleInputChange} 
              />
              <PriceInput 
                label="Business Plan (Monthly)" 
                value={settings.business_plan_price} 
                name="business_plan_price" 
                onChange={handleInputChange} 
              />
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PriceInput 
                label="Verification Fee" 
                value={settings.verification_fee} 
                name="verification_fee" 
                onChange={handleInputChange} 
              />
              <div className="flex items-center bg-blue-50/50 p-4 rounded-2xl gap-3 border border-blue-100">
                 <AlertTriangle className="h-5 w-5 text-blue-500 shrink-0" />
                 <p className="text-[11px] font-bold text-blue-700 leading-relaxed uppercase tracking-wider">
                    Annual price is calculated as monthly × 9 automatically.
                 </p>
              </div>
           </div>
           <div className="pt-4 flex justify-end">
              <SaveButton 
                loading={loading === 'pricing'} 
                success={success === 'pricing'}
                onClick={() => handleSave('pricing', ['pro_plan_price', 'business_plan_price', 'verification_fee'])}
              />
           </div>
        </div>
      </section>

      {/* BOOST PRICING */}
      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50">
           <h3 className="text-lg font-bold text-gray-900">Boost Pricing</h3>
           <p className="text-sm text-gray-500 mt-1 font-medium">Pricing for visibility enhancements (in Kobo)</p>
        </div>
        <div className="p-8 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <PriceInput label="Featured (7d)" value={settings.boost_featured_7} name="boost_featured_7" onChange={handleInputChange} />
              <PriceInput label="Featured (30d)" value={settings.boost_featured_30} name="boost_featured_30" onChange={handleInputChange} />
              <PriceInput label="Urgent Tag" value={settings.boost_urgent} name="boost_urgent" onChange={handleInputChange} />
              <PriceInput label="Refresh Now" value={settings.boost_refresh} name="boost_refresh" onChange={handleInputChange} />
           </div>
           <div className="pt-4 flex justify-end">
              <SaveButton 
                loading={loading === 'boosts'} 
                success={success === 'boosts'}
                onClick={() => handleSave('boosts', ['boost_featured_7', 'boost_featured_30', 'boost_urgent', 'boost_refresh'])}
              />
           </div>
        </div>
      </section>

      {/* SERVICE LISTING PRICING */}
      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50">
           <h3 className="text-lg font-bold text-gray-900">Service Provider Pricing</h3>
           <p className="text-sm text-gray-500 mt-1 font-medium">Monthly listing fee for campus service providers (in Kobo, e.g. 300000 = ₦3,000)</p>
        </div>
        <div className="p-8 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PriceInput 
                label="Service Listing Fee (Monthly)" 
                value={settings.service_listing_price} 
                name="service_listing_price" 
                onChange={handleInputChange} 
              />
              <div className="flex items-center bg-blue-50/50 p-4 rounded-2xl gap-3 border border-blue-100">
                 <AlertTriangle className="h-5 w-5 text-blue-500 shrink-0" />
                 <p className="text-[11px] font-bold text-blue-700 leading-relaxed uppercase tracking-wider">
                    Service providers must pay this fee monthly to keep their listing visible on the platform.
                 </p>
              </div>
           </div>
           <div className="pt-4 flex justify-end">
              <SaveButton 
                loading={loading === 'service_pricing'} 
                success={success === 'service_pricing'}
                onClick={() => handleSave('service_pricing', ['service_listing_price'])}
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
                    value={settings.max_free_listings || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 font-bold outline-none focus:border-[#1B4332]"
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Pro Plan Max</label>
                 <input 
                    type="number" 
                    name="max_pro_listings"
                    value={settings.max_pro_listings || ''}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 font-bold outline-none focus:border-[#1B4332]"
                 />
              </div>
           </div>
           <p className="text-xs font-bold text-gray-400 uppercase tracking-wider italic">* Business plan always has unlimited listings.</p>
           <div className="pt-4 flex justify-end">
              <SaveButton 
                loading={loading === 'limits'} 
                success={success === 'limits'}
                onClick={() => handleSave('limits', ['max_free_listings', 'max_pro_listings'])}
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
                       {(settings.maintenance_mode === 'true' || settings.maintenance_mode === true) ? 'Site is currently locked for maintenance.' : 'Site is live and accessible to all users.'}
                    </p>
                 </div>
              </div>
              <button 
                 onClick={() => {
                    const newValue = settings.maintenance_mode === 'true' ? 'false' : 'true'
                    if (confirm(`Are you sure you want to ${newValue === 'true' ? 'ENABLE' : 'DISABLE'} maintenance mode?`)) {
                       // Update local state then save
                       setSettings(prev => ({ ...prev, maintenance_mode: newValue }))
                       setTimeout(() => handleSave('maintenance', ['maintenance_mode']), 100)
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

function PriceInput({ label, value, name, onChange }: any) {
   return (
      <div className="space-y-2">
         <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{label}</label>
         <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">₦</span>
            <input 
               type="number" 
               name={name}
               value={value || ''}
               onChange={onChange}
               className="w-full pl-8 pr-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 font-bold outline-none focus:border-[#1B4332]"
            />
         </div>
      </div>
   )
}

function SaveButton({ loading, success, onClick }: any) {
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
