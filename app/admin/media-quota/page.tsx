import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient, getAdminClient } from "@/lib/supabase/server"
import { getCloudinaryPolicy, CLOUDINARY_LIMITS } from "@/lib/cloudinary-protection"
import { Video, ShieldCheck, AlertTriangle, ArrowLeft, RefreshCw, HardDrive, Activity, Zap, CheckCircle2 } from "lucide-react"

export const dynamic = "force-dynamic"
export const metadata = {
  title: "Media & Cloudinary Quota | HousePlug Admin",
  robots: { index: false, follow: false },
}

export default async function MediaQuotaPage() {
  const supabase = createClient()
  const db = getAdminClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?next=/admin/media-quota")
  }

  const { data: profile } = await db
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!["admin", "super_admin"].includes(profile?.role || "")) {
    redirect("/")
  }

  const policy = await getCloudinaryPolicy()
  const { metrics, tier } = policy

  const tierColors: Record<string, { bg: string; text: string; border: string }> = {
    green: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-300" },
    warning: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-300" },
    restrict_uploads: { bg: "bg-orange-50", text: "text-orange-900", border: "border-orange-300" },
    restrict_playback: { bg: "bg-red-50", text: "text-red-900", border: "border-red-300" },
    critical: { bg: "bg-red-100", text: "text-red-950", border: "border-red-400" },
  }

  const activeColor = tierColors[tier] || tierColors.green

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="text-gray-400 hover:text-gray-600 transition p-1 -ml-1 rounded-lg"
              title="Back to Admin Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-black text-[#1B4332]">
              Cloudinary Quota &amp; Media Protection
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Free Plan Guardrails: 25 monthly credits, 12 GB rolling bandwidth target, zero unneeded range requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider ${activeColor.bg} ${activeColor.text} ${activeColor.border}`}>
            Tier: {tier.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-gray-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-black uppercase tracking-wider">Total Credits</span>
            <Activity className="h-4 w-4 text-[#1B4332]" />
          </div>
          <p className="text-3xl font-black text-gray-900 mt-2">
            {metrics.creditsUsed} <span className="text-sm font-bold text-gray-400">/ {metrics.creditsLimit}</span>
          </p>
          <div className="mt-3 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                metrics.creditsUsed > 18 ? "bg-red-500" : metrics.creditsUsed > 12 ? "bg-amber-500" : "bg-emerald-600"
              }`}
              style={{ width: `${Math.min(100, (metrics.creditsUsed / metrics.creditsLimit) * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-500 mt-2 font-medium">
            Warning at 12 · Restrict uploads at 15
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-gray-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-black uppercase tracking-wider">30-Day Bandwidth</span>
            <Zap className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-gray-900 mt-2">
            {metrics.bandwidth30dGB} <span className="text-sm font-bold text-gray-400">GB</span>
          </p>
          <div className="mt-3 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                metrics.bandwidth30dGB > 12 ? "bg-amber-500" : "bg-emerald-600"
              }`}
              style={{ width: `${Math.min(100, (metrics.bandwidth30dGB / CLOUDINARY_LIMITS.BANDWIDTH_TARGET_GB) * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-500 mt-2 font-medium">
            Internal target: &lt; {CLOUDINARY_LIMITS.BANDWIDTH_TARGET_GB} GB / 30 days
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-gray-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-black uppercase tracking-wider">Storage Consumed</span>
            <HardDrive className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-3xl font-black text-gray-900 mt-2">
            {metrics.storageGB} <span className="text-sm font-bold text-gray-400">GB</span>
          </p>
          <div className="mt-3 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{ width: `${Math.min(100, (metrics.storageGB / CLOUDINARY_LIMITS.STORAGE_TARGET_GB) * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-500 mt-2 font-medium">
            Internal target: &lt; {CLOUDINARY_LIMITS.STORAGE_TARGET_GB} GB (514 media assets)
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-gray-200/80 bg-white shadow-xs">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-black uppercase tracking-wider">Transformations</span>
            <RefreshCw className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-3xl font-black text-gray-900 mt-2">
            {metrics.transformationsCount.toLocaleString("en-NG")}
          </p>
          <p className="text-[11px] text-emerald-700 font-bold mt-2">
            Canonical pipeline active (zero signature drift)
          </p>
          <p className="text-[11px] text-gray-400 font-medium mt-0.5">
            Source: {metrics.source === "live_api" ? "Cloudinary Admin API" : "Conservative Last-Known Baseline"}
          </p>
        </div>
      </div>

      {/* Historical Reporting Clarification Box */}
      <div className="p-6 rounded-2xl border border-amber-200 bg-amber-50/60 space-y-3">
        <div className="flex items-center gap-2 text-amber-900">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <h3 className="text-sm font-bold">Historical 12-Month Audit vs. 30-Day Aggregation</h3>
        </div>
        <p className="text-xs text-amber-950 leading-relaxed">
          Historical figures (38.39 GB bandwidth and 27,230 transformations) represent cumulative 365-day account totals (~3.2 GB/mo and 2,269 transformations/mo), not a single-month overage. However, recent 30-day bandwidth reached <strong>7.62 GB</strong> due to autoplay metadata range requests (<code className="font-mono bg-white/70 px-1 rounded">#t=0.1</code>) and dual video mounting.
        </p>
      </div>

      {/* Active Optimization Guardrails */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Active Optimization Guardrails</span>
          </h3>
          <ul className="space-y-3 text-xs text-gray-600">
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
              <span><strong>Click-to-Play Hero Posters:</strong> Listing pages render lightweight static JPEG posters. Video streams are only fetched if a user explicitly taps Play.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
              <span><strong>Static Thumbnail Posters:</strong> Replaced all <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">&lt;video src="#t=0.1"&gt;</code> elements in cards and galleries with 20KB static frames, saving ~98% of thumbnail bandwidth.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
              <span><strong>720p Resolution Cap:</strong> Canonical transformation <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">vc_h264,w_1280,c_limit,q_auto:good,f_mp4</code> prevents bloated 4K uploads from delivering unconstrained streams.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
              <span><strong>Pilot Upload Constraints:</strong> Enforces max 15MB file size and max 30-second duration client &amp; server side.</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#1B4332]" />
            <span>Tiered Protection Policy</span>
          </h3>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-gray-800">12 Credits (Warning):</span>
                <p className="text-[11px] text-gray-500">Admin banner notice; logs quota telemetry</p>
              </div>
              <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Tier 1</span>
            </div>

            <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-gray-800">15 Credits (Restrict Uploads):</span>
                <p className="text-[11px] text-gray-500">Video uploads paused; landlords guided to free Supabase photos</p>
              </div>
              <span className="text-[10px] font-black uppercase text-orange-700 bg-orange-100 px-2 py-0.5 rounded">Tier 2</span>
            </div>

            <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-gray-800">18 Credits (Restrict Playback):</span>
                <p className="text-[11px] text-gray-500">Player replaced with poster + WhatsApp CTA for video tour</p>
              </div>
              <span className="text-[10px] font-black uppercase text-red-700 bg-red-100 px-2 py-0.5 rounded">Tier 3</span>
            </div>

            <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
              <div>
                <span className="font-bold text-gray-800">22 Credits (Critical):</span>
                <p className="text-[11px] text-gray-500">Hard stop to avoid overages; WhatsApp contact 100% active</p>
              </div>
              <span className="text-[10px] font-black uppercase text-red-900 bg-red-200 px-2 py-0.5 rounded">Tier 4</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
