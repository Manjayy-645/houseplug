"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { Check, X, Zap, Flame, Star, RefreshCcw, CreditCard, Download, ShieldCheck, Crown, AlertTriangle, Sparkles } from "lucide-react"
import { formatNaira, formatDate } from "@/lib/utils"
import type { Subscription, Listing, Payment, Plan, BillingCycle, BoostType } from "@/types"
import { createClient } from "@/lib/supabase/client"
import { getLandlordSubscription } from "@/lib/billing"
import { isSubscriptionExpiringSoon, formatExpiryDate, daysUntilExpiry } from "@/lib/billing-utils"
import { BoostListingSelect } from "@/components/landlord/boost-listing-select"

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
  const [toast, setToast] = useState<{ msg: string; tone: "success" | "error" | "info" } | null>(null)
  const itemsPerPage = 5

  const supabase = createClient()

  // Surface payment/boost outcome passed back from the Paystack callback.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.get("boost") === "success") {
      setToast({ msg: "Boost applied successfully!", tone: "success" })
    } else if (p.get("payment") === "success") {
      setToast({ msg: "Payment successful!", tone: "success" })
    } else if (p.get("error") === "payment_failed") {
      setToast({ msg: "Payment failed. Please try again.", tone: "error" })
    } else if (p.get("error") === "no_reference") {
      setToast({ msg: "Payment reference missing. Please try again.", tone: "error" })
    } else if (p.get("status") === "processing") {
      setToast({ msg: "Payment received, applying your boost. Refresh in a moment.", tone: "info" })
    }
  }, [])

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: subscriptionData }, { data: listingsData }, { data: paymentsData }, { data: settingsData }] = await Promise.all([
        supabase
          .from('subscriptions')
          .select('plan, active, expires_at, is_trial, landlord_id, cancelled_at, billing_cycle')
          .eq('landlord_id', user.id)
          .eq('active', true)
          .gte('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from("listings").select("id, title, room_type, area").eq("landlord_id", user.id).eq("status", "active"),
        supabase.from("payments").select("*").eq("landlord_id", user.id).order("created_at", { ascending: false }),
        supabase.from('platform_settings').select('key, value')
      ])

      const settings = Object.fromEntries(
        settingsData?.map(s => [s.key, s.value]) ?? []
      )

      setPrices({
        pro_monthly: Number(settings.pro_plan_price ?? 500000),
        pro_annual: Math.round(Number(settings.pro_plan_price ?? 500000) * 9),
        business_monthly: Number(settings.business_plan_price ?? 1500000),
        business_annual: Math.round(Number(settings.business_plan_price ?? 1500000) * 9),
        verification: Number(settings.verification_fee ?? 200000),
        featured_7: Number(settings.boost_featured_7 ?? 150000),
        featured_30: Number(settings.boost_featured_30 ?? 400000),
        urgent: Number(settings.boost_urgent ?? 50000),
        refresh: Number(settings.boost_refresh ?? 30000),
        max_free_listings: settings.max_free_listings ? Number(settings.max_free_listings) : Infinity,
        max_pro_listings: settings.max_pro_listings ? Number(settings.max_pro_listings) : Infinity,
      })

      const sub = subscriptionData ? {
        ...subscriptionData,
        expired: false // Query already filters for active/not expired
      } : {
        plan: 'free',
        active: true,
        expired: false,
        billing_cycle: null,
        expires_at: null,
      }

      setSubscription(sub as any)
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
  const trialActive = (subscription as any)?.is_trial === true
  const trialDaysLeft = subscription?.expires_at ? daysUntilExpiry(subscription.expires_at) : 0

  const planDisplay: Record<string, string> = {
    free: 'Free Plan',
    pro: 'Pro Plan',
    business: 'Business Plan',
  }

  const tierRank: Record<string, number> = {
    free: 0,
    pro: 1,
    business: 2,
  }

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

  function getPlanButton(cardPlan: string, currentPlan: string) {
    const current = tierRank[currentPlan] ?? 0
    const card = tierRank[cardPlan] ?? 0

    if (cardPlan === currentPlan) {
      return { 
        label: trialActive && cardPlan === 'pro' 
          ? 'Subscribe to Pro' 
          : 'Current Plan',
        disabled: !trialActive,
        variant: trialActive ? 'primary' : 'disabled'
      }
    }
    if (card > current) {
      return { 
        label: `Upgrade to ${capitalize(cardPlan)}`, 
        disabled: false, 
        variant: 'primary' 
      }
    }
    return { 
      label: `Downgrade to ${capitalize(cardPlan)}`, 
      disabled: false, 
      variant: 'outline' 
    }
  }

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
      {/* Payment outcome banner */}
      {toast && (
        <div
          className={`flex items-center justify-between gap-4 rounded-xl border p-4 shadow-sm ${
            toast.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : toast.tone === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          <p className="text-sm font-semibold">{toast.msg}</p>
          <button
            onClick={() => setToast(null)}
            className="shrink-0 rounded-lg p-1 opacity-70 transition hover:opacity-100"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* SECTION 1 — Status Banner */}
      <section>
        {trialActive ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm text-amber-900 font-bold">
                  🎉 You&apos;re on a 30-day Pro trial — {trialDaysLeft} days left.
                </p>
                <p className="text-xs text-amber-800 mt-1">
                  Subscribe before it ends to keep featured placement and AI descriptions.
                </p>
              </div>
            </div>
            <button
              onClick={() => document.getElementById('plan-cards')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-amber-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-amber-700 transition"
            >
              Subscribe to Pro
            </button>
          </div>
        ) : currentPlanId === 'free' ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 shrink-0 text-gray-500" />
              <div>
                <p className="text-sm text-gray-900 font-bold">
                  You&apos;re on the Free plan.
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Upgrade to Pro to get featured placement, AI descriptions, and full analytics.
                </p>
              </div>
            </div>
            <button
              onClick={() => document.getElementById('plan-cards')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-[#1B4332] text-white px-6 py-2 rounded-xl font-bold text-sm hover:brightness-110 transition"
            >
              Upgrade to Pro
            </button>
          </div>
        ) : currentPlanId === 'pro' ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Check className="h-6 w-6 shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm text-emerald-900 font-bold">
                  ✓ You&apos;re on Pro.
                </p>
                <p className="text-xs text-emerald-800 mt-1">
                  Your listings are featured in search.
                </p>
              </div>
            </div>
            {subscription?.expires_at && (
               <p className="text-xs font-medium text-emerald-700">Renews on {formatExpiryDate(subscription.expires_at)}</p>
            )}
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Check className="h-6 w-6 shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm text-emerald-900 font-bold">
                  ✓ You&apos;re on Business.
                </p>
                <p className="text-xs text-emerald-800 mt-1">
                  Your listings always appear first.
                </p>
              </div>
            </div>
            {subscription?.expires_at && (
               <p className="text-xs font-medium text-emerald-700">Renews on {formatExpiryDate(subscription.expires_at)}</p>
            )}
          </div>
        )}
      </section>

      {/* SECTION 2 — Plan Cards */}
      <section id="plan-cards" className="space-y-8 text-center scroll-mt-20">
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
              <span className="absolute -top-3 -right-2 rounded-full bg-[#F59E0B] px-2 py-0.5 text-[10px] font-black text-white ring-2 ring-white">
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
              features: [
                prices.max_free_listings === Infinity ? "Unlimited listings" : `Up to ${prices.max_free_listings} active listings`, 
                "Standard placement", 
                "WhatsApp inquiries", 
                "Basic analytics", 
                "Community support"
              ],
              color: "border-gray-200",
            },
            {
              id: "pro",
              name: "Pro",
              price: billingCycle === "monthly" ? formatNaira(prices.pro_monthly / 100) : formatNaira(prices.pro_annual / 100),
              subtext: billingCycle === "annual" ? "billed annually" : "billed monthly",
              features: [
                "Everything in Free, plus:", 
                prices.max_pro_listings === Infinity ? "Unlimited listings" : `Up to ${prices.max_pro_listings} active listings`, 
                "Featured badge & placement", 
                "AI descriptions", 
                "Priority support"
              ],
              color: "border-[#F59E0B] border-2",
              recommended: true,
            },
            {
              id: "business",
              name: "Business",
              price: billingCycle === "monthly" ? formatNaira(prices.business_monthly / 100) : formatNaira(prices.business_annual / 100),
              subtext: billingCycle === "annual" ? "billed annually" : "billed monthly",
              features: [
                "Everything in Pro, plus:", 
                "Unlimited listings forever", 
                "Always top of search", 
                "Account manager", 
                "Bulk listing upload"
              ],
              color: "border-gray-900",
            }
          ].map((plan) => {
            const btn = getPlanButton(plan.id, currentPlanId)
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl p-6 transition hover:shadow-xl shadow-sm border bg-white ${plan.color}`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#F59E0B] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-4 flex flex-col items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold text-[#111827]">{plan.price}</span>
                  <div className="flex flex-col items-center w-full">
                    <span className="text-sm text-gray-500">{plan.id === 'free' ? '' : billingCycle === 'monthly' ? '/month' : '/year'}</span>
                    {plan.subtext && <span className="text-xs text-gray-400">{plan.subtext}</span>}
                  </div>
                </div>

                <div className="my-6 border-t border-gray-100" />

                <ul className="mb-8 space-y-4 text-left">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="h-4 w-4 shrink-0 text-[#10B981] mt-0.5" />
                      <span className="text-sm text-gray-600">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  disabled={btn.disabled || actionLoading === plan.id}
                  onClick={() => handleInitiatePayment({ type: 'subscription', plan: plan.id, billing_cycle: billingCycle })}
                  className={`mt-auto w-full rounded-lg py-3 text-sm font-bold transition active:scale-95 ${
                    btn.variant === 'disabled'
                      ? "bg-gray-100 text-gray-400 cursor-default"
                      : btn.variant === 'outline'
                        ? "border border-[#1B4332] text-[#1B4332] hover:bg-gray-50"
                        : "bg-[#1B4332] text-white hover:brightness-110"
                  }`}
                >
                  {actionLoading === plan.id ? "Processing..." : btn.label}
                </button>
              </div>
            )
          })}
        </div>

        {/* Verification Add-on */}
        <div className="border rounded-2xl p-6 bg-white mt-6 text-left max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-[#10B981] shrink-0" />
            <div>
              <p className="font-semibold text-lg text-gray-900">Get Verified</p>
              <p className="text-sm text-gray-500">
                {formatNaira(prices.verification / 100)} one-time — available on any plan
              </p>
            </div>
            <Link href="/landlord/verification" 
               className="sm:ml-auto bg-[#10B981] text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:brightness-110 transition text-center">
              Get Verified
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-4 leading-relaxed">
            Submit your ID and property documents for a verified 
            badge that builds trust with students. Verified listings receive 
            3x more inquiries on average.
          </p>
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
              desc: "Top placement with a Featured badge for 7 days"
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
              desc: "Adds an Urgent badge for immediate fill"
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
                <BoostListingSelect
                  listings={listings as any}
                  selected={selectedBoostListings[boost.id] || null}
                  onSelect={(id) => setSelectedBoostListings(prev => ({ ...prev, [boost.id]: id }))}
                />
                <button
                  disabled={!selectedBoostListings[boost.id] || actionLoading === boost.id}
                  onClick={() => handleInitiatePayment({
                    type: 'boost',
                    boost_type: boost.id,
                    listing_id: selectedBoostListings[boost.id]
                  })}
                  className="w-full rounded-xl bg-[#1B4332] py-3 text-sm font-black text-white shadow-md transition active:scale-95 hover:brightness-110 disabled:opacity-50 disabled:grayscale"
                >
                  {actionLoading === boost.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCcw className="h-4 w-4 animate-spin" /> Processing...
                    </span>
                  ) : "Buy Boost"}
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
