"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { Check, X, Zap, Flame, Star, RefreshCcw, CreditCard, Download, ShieldCheck, Crown } from "lucide-react"
import { formatNaira, formatDate } from "@/lib/utils"
import type { Subscription, Listing, Payment, Plan, BillingCycle, BoostType } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { getLandlordSubscription } from "@/lib/billing"
import { isSubscriptionExpiringSoon, formatExpiryDate } from "@/lib/billing-utils"

export default function SubscriptionPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly")
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [listings, setListings] = useState<Listing[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [prices, setPrices] = useState<any>(null)
  const [selectedBoostListings, setSelectedBoostListings] = useState<Record<string, string>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [subscriptionData, { data: listingsData }, { data: paymentsData }, { data: settingsData }] = await Promise.all([
        getLandlordSubscription(user.id),
        supabase.from("listings").select("id, title").eq("landlord_id", user.id).eq("status", "active"),
        supabase.from("payments").select("*").eq("landlord_id", user.id).order("created_at", { ascending: false }),
        supabase.from('platform_settings').select('key, value')
      ])

      const settings = Object.fromEntries(
        settingsData?.map(s => [s.key, Number(s.value)]) ?? []
      )

      setPrices({
        pro_monthly: settings.pro_plan_price ?? 500000,
        pro_annual: Math.round((settings.pro_plan_price ?? 500000) * 9),
        business_monthly: settings.business_plan_price ?? 1500000,
        business_annual: Math.round((settings.business_plan_price ?? 1500000) * 9),
        verification: settings.verification_fee ?? 200000,
        featured_7: settings.boost_featured_7 ?? 150000,
        featured_30: settings.boost_featured_30 ?? 400000,
        urgent: settings.boost_urgent ?? 50000,
        refresh: settings.boost_refresh ?? 30000,
      })

      setSubscription(subscriptionData as Subscription)
      setListings(listingsData as Listing[])
      setPayments(paymentsData as Payment[])
      setLoading(false)
    }
    loadData()
  }, [supabase])

  const handleInitiatePayment = async (payload: any) => {
    setActionLoading(payload.plan || payload.boost_type || 'verification')
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.href = data.authorization_url
    } catch (error: any) {
      alert(error.message)
      setActionLoading(null)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? Your listings will lose their priority placement at the end of your billing period.")) return
    
    setActionLoading('cancel')
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ cancelled_at: new Date().toISOString() })
        .eq('landlord_id', subscription?.landlord_id)
      
      if (error) throw error
      setSubscription(prev => prev ? { ...prev, cancelled_at: new Date().toISOString() } : null)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setActionLoading(null)
    }
  }

  const exportPaymentsCSV = () => {
    const headers = ["Date", "Type", "Amount", "Status", "Reference"]
    const rows = payments.map(p => [
      formatDate(p.created_at),
      p.type.toUpperCase() + (p.plan ? ` (${p.plan})` : ""),
      p.amount / 100,
      p.status,
      p.paystack_reference
    ])
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `houseplug_payments_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
  }

  const currentPlanId = subscription?.plan || "free"
  const expiringSoon = subscription?.expires_at ? isSubscriptionExpiringSoon(subscription.expires_at) : false

  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return payments.slice(start, start + itemsPerPage)
  }, [payments, currentPage])

  const totalPages = Math.ceil(payments.length / itemsPerPage)

  if (loading || !prices) return (
    <div className="flex h-96 items-center justify-center">
      <RefreshCcw className="h-8 w-8 animate-spin text-[#1B4332]" />
    </div>
  )

  return (
    <div className="space-y-10 p-4 lg:p-8 pb-24">
      {/* SECTION 1 — Current Plan Banner */}
      <section>
        {subscription?.plan !== "free" ? (
          <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl p-6 md:p-8 text-white shadow-xl ${
            subscription?.expired ? 'bg-red-900 shadow-red-900/20' : 
            expiringSoon ? 'bg-amber-700 shadow-amber-900/20' : 
            'bg-emerald-900 shadow-emerald-900/20'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                subscription?.expired ? 'bg-red-800 text-red-400' :
                expiringSoon ? 'bg-amber-600 text-amber-300' :
                'bg-emerald-800 text-emerald-400'
              }`}>
                {subscription?.expired ? <X className="h-8 w-8" /> : <Crown className="h-8 w-8" />}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <p className={`text-sm font-bold uppercase tracking-widest ${
                    subscription?.expired ? 'text-red-400' :
                    expiringSoon ? 'text-amber-300' :
                    'text-emerald-400'
                  }`}>
                    {subscription?.expired ? 'Expired Plan' : expiringSoon ? 'Expiring Soon' : 'Active Plan'}
                  </p>
                  {subscription?.expired ? (
                     <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">● Expired</span>
                  ) : expiringSoon ? (
                     <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">⚠ Warning</span>
                  ) : (
                     <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">● Active</span>
                  )}
                </div>
                <h2 className="text-3xl font-black capitalize">{subscription?.plan} Plan</h2>
                <p className="mt-1 opacity-80 font-medium">
                  {subscription?.expired 
                    ? `Expired on ${formatExpiryDate(subscription.expires_at)} — Listings no longer featured.` 
                    : subscription?.cancelled_at 
                    ? `Ending on ${formatExpiryDate(subscription.expires_at)}` 
                    : `Renews on ${formatExpiryDate(subscription?.expires_at || null)}`
                  }
                  {" "}&middot; {subscription?.billing_cycle === 'monthly' ? 'Monthly' : 'Annual'} billing
                </p>
              </div>
            </div>
            {!subscription?.cancelled_at && !subscription?.expired && (
              <button 
                onClick={handleCancelSubscription}
                disabled={actionLoading === 'cancel'}
                className="text-sm font-bold text-emerald-300 hover:text-white transition underline underline-offset-4"
              >
                {actionLoading === 'cancel' ? 'Cancelling...' : 'Cancel subscription'}
              </button>
            )}
            {subscription?.expired && (
              <button 
                onClick={() => handleInitiatePayment({ type: 'subscription', plan: subscription.plan, billing_cycle: subscription.billing_cycle || 'monthly' })}
                className="bg-white text-red-900 px-6 py-2.5 rounded-xl font-black text-sm hover:bg-red-50 transition shadow-lg"
              >
                Renew Now
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl bg-amber-50 border-2 border-amber-200 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-amber-600/80">Current Status</p>
                <h2 className="text-3xl font-black text-amber-900">Free Plan</h2>
                <p className="mt-1 text-amber-800/70 font-medium">
                  You are currently limited to 1 active listing and standard search placement.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2 — Plan Cards */}
      <section className="space-y-8 text-center">
        <div>
          <h2 className="text-3xl font-black text-gray-900">Choose a Plan</h2>
          <p className="mt-2 text-gray-600 font-medium">Scale your property business with premium features</p>
          
          <div className="mt-6 inline-flex items-center rounded-2xl bg-gray-100 p-1.5 border border-gray-200">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`rounded-xl px-6 py-2.5 text-sm font-black transition ${
                billingCycle === "monthly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`relative rounded-xl px-6 py-2.5 text-sm font-black transition ${
                billingCycle === "annual" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Annual
              <span className="absolute -top-3 -right-2 rounded-full bg-accent px-2 py-0.5 text-[10px] font-black text-white ring-2 ring-white">
                SAVE 25%+
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {[
            {
              id: "free",
              name: "Free",
              price: "₦0",
              features: ["1 active listing", "Standard placement", "Basic analytics", "WhatsApp inquiries"],
              color: "border-gray-200",
              btnText: "Current Plan",
              active: currentPlanId === "free" && !subscription?.expired
            },
            {
              id: "pro",
              name: "Pro",
              price: billingCycle === "monthly" ? formatNaira(prices.pro_monthly / 100) : formatNaira(prices.pro_annual / 100),
              subtext: billingCycle === "annual" ? `${formatNaira(Math.round(prices.pro_annual / 12 / 100))} /mo billed yearly` : "billed monthly",
              features: ["5 active listings", "Featured badge", "Priority placement", "Full analytics dashboard", "Priority support"],
              color: "border-emerald-200 bg-emerald-50/30",
              recommended: true,
              btnText: (currentPlanId === "pro" && !subscription?.expired) ? "Current Plan" : subscription?.expired && currentPlanId === "pro" ? "Renew Pro" : currentPlanId === "business" ? "Downgrade to Pro" : "Upgrade to Pro",
              active: currentPlanId === "pro" && !subscription?.expired
            },
            {
              id: "business",
              name: "Business",
              price: billingCycle === "monthly" ? formatNaira(prices.business_monthly / 100) : formatNaira(prices.business_annual / 100),
              subtext: billingCycle === "annual" ? `${formatNaira(Math.round(prices.business_annual / 12 / 100))} /mo billed yearly` : "billed monthly",
              features: ["Unlimited listings", "Always top of search", "Featured + Verified badges", "Dedicated account manager", "Bulk CSV upload"],
              color: "border-gray-900",
              btnText: (currentPlanId === "business" && !subscription?.expired) ? "Current Plan" : subscription?.expired && currentPlanId === "business" ? "Renew Business" : "Upgrade to Business",
              active: currentPlanId === "business" && !subscription?.expired
            }
          ].map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-3xl border-2 p-8 transition hover:shadow-xl ${plan.color} ${
                plan.recommended ? "shadow-lg shadow-emerald-900/5" : "bg-white"
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#1B4332] px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-lg">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-black text-gray-900">{plan.name}</h3>
              <div className="mt-4 flex flex-col items-baseline justify-center gap-1">
                <span className="text-4xl font-black text-gray-900">{plan.price}</span>
                {plan.subtext && <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">{plan.subtext}</span>}
              </div>

              <ul className="mt-8 space-y-4 text-left">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm font-semibold text-gray-600">
                    <Check className="h-5 w-5 shrink-0 text-emerald-500" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                disabled={(plan.active && !subscription?.expired) || actionLoading === plan.id}
                onClick={() => handleInitiatePayment({ type: 'subscription', plan: plan.id, billing_cycle: billingCycle })}
                className={`mt-auto w-full rounded-2xl py-4 text-sm font-black transition active:scale-95 ${
                  plan.active && !subscription?.expired
                    ? "bg-gray-100 text-gray-400 cursor-default"
                    : plan.id === 'business'
                      ? "bg-gray-900 text-white hover:bg-gray-800"
                      : "bg-[#1B4332] text-white hover:brightness-110"
                }`}
              >
                {actionLoading === plan.id ? "Processing..." : plan.btnText}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3 — Boost Your Listings */}
      <section className="space-y-6">
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-black text-gray-900">Boost Your Listings</h2>
          <p className="mt-1 text-gray-600 font-medium">Get instant visibility for specific rooms</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { 
              id: "featured_7", 
              name: "Featured 7 days", 
              price: prices.featured_7, 
              icon: Star, 
              color: "text-amber-500 bg-amber-50",
              desc: "Top placement with ⭐ badge for 7 days"
            },
            { 
              id: "featured_30", 
              name: "Featured 30 days", 
              price: prices.featured_30, 
              icon: Crown, 
              color: "text-emerald-500 bg-emerald-50",
              desc: "Maximum exposure for a full month"
            },
            { 
              id: "urgent", 
              name: "Urgent Tag", 
              price: prices.urgent, 
              icon: Flame, 
              color: "text-red-500 bg-red-50",
              desc: "Adds 🔥 Urgent badge for immediate fill"
            },
            { 
              id: "refresh", 
              name: "Refresh Now", 
              price: prices.refresh, 
              icon: RefreshCcw, 
              color: "text-blue-500 bg-blue-50",
              desc: "Bumps your listing to the very top"
            }
          ].map((boost) => (
            <div key={boost.id} className="flex flex-col rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${boost.color}`}>
                <boost.icon className="h-6 w-6" />
              </div>
              <h3 className="font-black text-gray-900">{boost.name}</h3>
              <p className="mt-1 text-xs font-bold text-gray-400 uppercase">{formatNaira(boost.price / 100)}</p>
              <p className="mt-3 text-xs font-medium text-gray-500 leading-relaxed">{boost.desc}</p>
              
              <div className="mt-6 space-y-3">
                <select 
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold outline-none focus:border-[#1B4332]"
                  value={selectedBoostListings[boost.id] || ""}
                  onChange={(e) => setSelectedBoostListings(prev => ({ ...prev, [boost.id]: e.target.value }))}
                >
                  <option value="">Select a listing...</option>
                  {listings.map(l => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
                </select>
                <button
                  disabled={!selectedBoostListings[boost.id] || actionLoading === boost.id}
                  onClick={() => handleInitiatePayment({ 
                    type: 'boost', 
                    boost_type: boost.id, 
                    listing_id: selectedBoostListings[boost.id] 
                  })}
                  className="w-full rounded-xl bg-[#F59E0B] py-2.5 text-xs font-black text-gray-900 shadow-md shadow-amber-900/10 transition active:scale-95 disabled:opacity-50 disabled:grayscale"
                >
                  {actionLoading === boost.id ? "..." : "Buy Boost"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4 — Payment History */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-gray-900">Payment History</h2>
          <button 
            onClick={exportPaymentsCSV}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>

        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Date</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Type</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Amount</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-gray-400">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm font-medium text-gray-500">
                      No payments found yet.
                    </td>
                  </tr>
                ) : (
                  paginatedPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-gray-900">
                        {formatDate(p.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-600">
                        <div className="flex items-center gap-2">
                           <CreditCard className="h-4 w-4 text-gray-400" />
                           <span className="capitalize">{p.type.replace('_', ' ')} {p.plan && `(${p.plan})`}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-black text-[#1B4332]">
                        {formatNaira(p.amount / 100)}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold">
                        <span className={`rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                          p.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 
                          p.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                          'bg-red-100 text-red-700'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-gray-400">
                        {p.paystack_reference}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-50 bg-gray-50/30 px-6 py-4">
              <p className="text-xs font-bold text-gray-400">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, payments.length)} of {payments.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  <RefreshCcw className="h-4 w-4 -scale-x-100" />
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`h-8 w-8 rounded-lg text-xs font-black transition ${
                        currentPage === i + 1 ? "bg-[#1B4332] text-white" : "text-gray-400 hover:bg-gray-100"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  <RefreshCcw className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
