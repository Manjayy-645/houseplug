"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { 
  Wrench, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  ExternalLink, 
  MessageSquare, 
  User, 
  Calendar, 
  ShieldCheck, 
  XCircle, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  Building2,
  DollarSign,
  GraduationCap
} from "lucide-react"
import { UNIVERSITIES } from "@/lib/constants"
import { HOUSING_SERVICE_CATEGORIES } from "@/lib/service-submission"

export type AdminServiceItem = {
  id: string
  user_id: string
  business_name: string
  category: string
  university: string
  description: string
  pricing_type: string
  price_amount: number | null
  price_unit: string | null
  whatsapp_number: string
  is_student_owned: boolean
  status: string
  vetted_at: string | null
  vetting_expires_at: string | null
  safety_requirements?: string | null
  service_hours?: string | null
  created_at: string
  owner?: {
    full_name: string | null
    email: string | null
    role: string | null
    phone?: string | null
  } | null
}

const categoryIcons: Record<string, string> = {
  moving: "🚚",
  cleaning: "🧹",
  repairs: "⚡",
  painting: "🎨",
  laundry: "🧺",
  gas_refill: "⛽",
}

export function ServiceModerationList({
  initialServices,
  defaultStatus = "all",
}: {
  initialServices: AdminServiceItem[]
  defaultStatus?: string
}) {
  const [services, setServices] = useState<AdminServiceItem[]>(initialServices)
  const [activeTab, setActiveTab] = useState<string>(
    defaultStatus === "pending" || initialServices.some(s => {
      const st = (s.status || "").trim().toLowerCase()
      return st === "pending" || st === "in_review" || st === "new" || !st
    })
      ? "pending"
      : "all"
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedCampus, setSelectedCampus] = useState("all")
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const [expandedVetting, setExpandedVetting] = useState<Record<string, boolean>>({})
  const [feedback, setFeedback] = useState<{ id: string; msg: string; error?: boolean } | null>(null)

  // Status matching helpers
  const isPendingStatus = (st?: string | null) => {
    const s = (st || "").trim().toLowerCase()
    return s === "pending" || s === "in_review" || s === "new" || s === "submitted" || !s
  }
  const isActiveStatus = (st?: string | null) => {
    const s = (st || "").trim().toLowerCase()
    return s === "active" || s === "approved" || s === "published"
  }
  const isPausedStatus = (st?: string | null) => {
    const s = (st || "").trim().toLowerCase()
    return s === "paused" || s === "rejected" || s === "declined" || s === "inactive"
  }

  // Status counts
  const pendingCount = useMemo(() => services.filter(s => isPendingStatus(s.status)).length, [services])
  const activeCount = useMemo(() => services.filter(s => isActiveStatus(s.status)).length, [services])
  const pausedCount = useMemo(() => services.filter(s => isPausedStatus(s.status)).length, [services])

  // Filtered services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      // Tab filter
      if (activeTab === "pending" && !isPendingStatus(s.status)) return false
      if (activeTab === "active" && !isActiveStatus(s.status)) return false
      if (activeTab === "paused" && !isPausedStatus(s.status)) return false

      // Category filter
      if (selectedCategory !== "all" && s.category !== selectedCategory) return false

      // Campus filter
      if (selectedCampus !== "all" && s.university !== selectedCampus) return false

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesName = s.business_name?.toLowerCase().includes(query)
        const matchesDesc = s.description?.toLowerCase().includes(query)
        const matchesPhone = s.whatsapp_number?.includes(query)
        const matchesOwner = s.owner?.full_name?.toLowerCase().includes(query) || s.owner?.email?.toLowerCase().includes(query)
        if (!matchesName && !matchesDesc && !matchesPhone && !matchesOwner) return false
      }

      return true
    })
  }, [services, activeTab, selectedCategory, selectedCampus, searchQuery])

  // Quick or Custom Review
  const handleReview = async (
    serviceId: string, 
    approved: boolean, 
    customPayload?: {
      days?: number
      evidence_reference?: string
      safety_requirements?: string
      service_hours?: string
    }
  ) => {
    setActionLoading((prev) => ({ ...prev, [serviceId]: true }))
    setFeedback(null)

    try {
      const payload = {
        approved,
        days: customPayload?.days || 90,
        evidence_reference: customPayload?.evidence_reference || (approved ? "Approved via HousePlug Admin Review" : "Declined or paused by Admin"),
        safety_requirements: customPayload?.safety_requirements || "Identity, category safety guidelines, and student contact confirmed.",
        service_hours: customPayload?.service_hours || "Mon-Sat 8:00 AM - 6:00 PM",
      }

      const res = await fetch(`/api/admin/services/${serviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to update service status")
      }

      // Update local state
      setServices((prev) =>
        prev.map((s) =>
          s.id === serviceId
            ? {
                ...s,
                status: approved ? "active" : "paused",
                vetted_at: approved ? new Date().toISOString() : null,
                vetting_expires_at: approved
                  ? new Date(Date.now() + (payload.days * 24 * 60 * 60 * 1000)).toISOString()
                  : null,
              }
            : s
        )
      )

      setFeedback({
        id: serviceId,
        msg: approved ? "Service approved and published live!" : "Service paused / rejected.",
      })
    } catch (err: any) {
      setFeedback({ id: serviceId, msg: err.message || "Failed to submit review", error: true })
    } finally {
      setActionLoading((prev) => ({ ...prev, [serviceId]: false }))
    }
  }

  // Delete service
  const handleDelete = async (serviceId: string, serviceName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${serviceName}"?`)) {
      return
    }

    setActionLoading((prev) => ({ ...prev, [serviceId]: true }))
    setFeedback(null)

    try {
      const res = await fetch(`/api/admin/services/${serviceId}`, {
        method: "DELETE",
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete service")
      }

      setServices((prev) => prev.filter((s) => s.id !== serviceId))
      setFeedback({ id: serviceId, msg: `"${serviceName}" was deleted.` })
    } catch (err: any) {
      setFeedback({ id: serviceId, msg: err.message || "Failed to delete service", error: true })
    } finally {
      setActionLoading((prev) => ({ ...prev, [serviceId]: false }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === "pending"
              ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400/30"
              : "bg-white border-gray-100 hover:border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">In Review</span>
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{pendingCount}</p>
          <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Awaiting moderation</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("active")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === "active"
              ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/30"
              : "bg-white border-gray-100 hover:border-gray-200"
          }`}
        >
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Live &amp; Vetted</span>
          <p className="text-2xl font-black text-emerald-800 mt-2">{activeCount}</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Published on site</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("paused")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === "paused"
              ? "bg-gray-100 border-gray-300 ring-2 ring-gray-400/30"
              : "bg-white border-gray-100 hover:border-gray-200"
          }`}
        >
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Paused / Rejected</span>
          <p className="text-2xl font-black text-gray-700 mt-2">{pausedCount}</p>
          <p className="text-[11px] text-gray-500 font-medium mt-0.5">Inactive listings</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === "all"
              ? "bg-[#1B4332]/5 border-[#1B4332]/30 ring-2 ring-[#1B4332]/20"
              : "bg-white border-gray-100 hover:border-gray-200"
          }`}
        >
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Total Services</span>
          <p className="text-2xl font-black text-[#1B4332] mt-2">{services.length}</p>
          <p className="text-[11px] text-gray-500 font-medium mt-0.5">Across all campuses</p>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search service, vendor, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332]"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter by service category"
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 bg-gray-50/50 text-gray-700 focus:outline-none focus:border-[#1B4332]"
          >
            <option value="all">All Categories</option>
            {HOUSING_SERVICE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Campus Filter */}
          <select
            value={selectedCampus}
            onChange={(e) => setSelectedCampus(e.target.value)}
            aria-label="Filter by campus"
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 bg-gray-50/50 text-gray-700 focus:outline-none focus:border-[#1B4332]"
          >
            <option value="all">All Campuses</option>
            {UNIVERSITIES.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.shortName})
              </option>
            ))}
          </select>

          {/* Live View Link */}
          <Link
            href="/services"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#1B4332] bg-emerald-50 hover:bg-emerald-100 rounded-xl transition"
          >
            <span>Live Services</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between ${
            feedback.error
              ? "bg-red-50 text-red-800 border border-red-200"
              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
          }`}
        >
          <span>{feedback.msg}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 border-b border-gray-200 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === "pending"
              ? "border-amber-500 text-amber-900 bg-amber-50/60"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <span>Pending Review</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
            activeTab === "pending" ? "bg-amber-200 text-amber-900" : "bg-gray-100 text-gray-600"
          }`}>
            {pendingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === "all"
              ? "border-[#1B4332] text-[#1B4332] bg-emerald-50/60"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <span>All Services</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
            activeTab === "all" ? "bg-emerald-200 text-emerald-900" : "bg-gray-100 text-gray-600"
          }`}>
            {services.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("active")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === "active"
              ? "border-emerald-600 text-emerald-900 bg-emerald-50/60"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <span>Live &amp; Vetted</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
            activeTab === "active" ? "bg-emerald-200 text-emerald-900" : "bg-gray-100 text-gray-600"
          }`}>
            {activeCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("paused")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === "paused"
              ? "border-gray-500 text-gray-900 bg-gray-100"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <span>Paused / Rejected</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
            activeTab === "paused" ? "bg-gray-300 text-gray-800" : "bg-gray-100 text-gray-600"
          }`}>
            {pausedCount}
          </span>
        </button>
      </div>

      {/* Services List */}
      {filteredServices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center">
          <div className="h-12 w-12 rounded-full bg-emerald-50 text-[#1B4332] flex items-center justify-center mx-auto mb-3">
            <Wrench className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-gray-900">
            {services.length === 0
              ? "No campus services recorded"
              : `No services found in "${activeTab}" tab`}
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {services.length === 0
              ? "There are currently no campus services in the database. When providers submit services, they will appear here."
              : `You have ${services.length} total service${services.length !== 1 ? "s" : ""} registered. Switch tabs or clear your category and campus filters to view them.`}
          </p>
          {services.length > 0 && activeTab !== "all" && (
            <button
              type="button"
              onClick={() => {
                setActiveTab("all")
                setSelectedCategory("all")
                setSelectedCampus("all")
                setSearchQuery("")
              }}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#1B4332] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#143427] transition"
            >
              View All Services ({services.length})
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredServices.map((service) => {
            const isPending = service.status === "pending"
            const isActive = service.status === "active"
            const isBusy = actionLoading[service.id]
            const isExpanded = !!expandedVetting[service.id]

            const categoryMeta = HOUSING_SERVICE_CATEGORIES.find((c) => c.id === service.category)
            const universityMeta = UNIVERSITIES.find((u) => u.id === service.university)
            const icon = categoryIcons[service.category] || "🔧"

            const waClean = service.whatsapp_number?.replace(/\D/g, "")
            const waInternational = waClean?.startsWith("0") ? "234" + waClean.slice(1) : waClean

            return (
              <div
                key={service.id}
                className={`bg-white rounded-2xl border transition-all ${
                  isPending
                    ? "border-amber-200 shadow-sm ring-1 ring-amber-300/40"
                    : "border-gray-200/80 shadow-2xs hover:border-gray-300"
                }`}
              >
                {/* Header row */}
                <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl p-2 rounded-xl bg-gray-50 border border-gray-100 shrink-0">
                      {icon}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-extrabold text-[#1B4332]">
                          {service.business_name}
                        </h3>

                        {/* Status badge */}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                            <Clock className="h-3 w-3 text-amber-700" /> In Review
                          </span>
                        )}
                        {isActive && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <CheckCircle2 className="h-3 w-3 text-emerald-700" /> Live on Site
                          </span>
                        )}
                        {!isPending && !isActive && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                            <XCircle className="h-3 w-3 text-gray-500" /> Paused
                          </span>
                        )}

                        {/* Student Owned badge */}
                        {service.is_student_owned && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                            <GraduationCap className="h-3 w-3" /> Student Provider
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-semibold text-gray-700">
                          {categoryMeta?.label || service.category}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-gray-600">
                          <Building2 className="h-3 w-3 text-gray-400" />
                          {universityMeta?.name || service.university} ({universityMeta?.shortName || service.university})
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          Submitted {new Date(service.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Pricing tag */}
                  <div className="sm:text-right shrink-0">
                    <div className="inline-flex items-center gap-1 text-sm font-black text-[#1B4332] bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                      <span>₦{(service.price_amount ?? 0).toLocaleString("en-NG")}</span>
                      <span className="text-[10px] font-medium text-emerald-800">
                        {service.pricing_type === "starting_from" ? "(starting from)" : "(fixed)"}
                      </span>
                    </div>
                    {service.price_unit && (
                      <p className="text-[11px] text-gray-500 mt-0.5">Covers: {service.price_unit}</p>
                    )}
                  </div>
                </div>

                {/* Body: Description + Vendor contact info */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-2 space-y-3">
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Service Description &amp; Scope
                      </p>
                      <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-100 text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                        {service.description}
                      </div>
                    </div>

                    {/* Vetting status indicator if already vetted */}
                    {service.vetted_at && (
                      <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 flex flex-wrap items-center justify-between text-[11px] text-emerald-800">
                        <span className="flex items-center gap-1 font-semibold">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                          Vetted on {new Date(service.vetted_at).toLocaleDateString("en-GB")}
                        </span>
                        {service.vetting_expires_at && (
                          <span className="text-emerald-700">
                            Valid until: {new Date(service.vetting_expires_at).toLocaleDateString("en-GB")}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Vendor & Contact column */}
                  <div className="space-y-3 p-4 rounded-xl bg-gray-50/50 border border-gray-100 text-xs">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Provider Contact
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <span className="font-bold text-gray-900 truncate">
                          {service.owner?.full_name || "Vendor"}
                        </span>
                      </div>

                      {service.owner?.email && (
                        <p className="text-gray-500 truncate text-[11px] pl-5">
                          {service.owner.email}
                        </p>
                      )}

                      <div className="pt-2 border-t border-gray-200/60">
                        <p className="text-[11px] text-gray-500 font-medium">WhatsApp Number:</p>
                        <p className="font-extrabold text-[#1B4332] text-sm mt-0.5">
                          {service.whatsapp_number}
                        </p>

                        <a
                          href={`https://wa.me/${waInternational}?text=${encodeURIComponent(
                            `Hello from HousePlug Admin regarding your "${service.business_name}" listing.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#1B4332] font-bold text-[11px] transition"
                        >
                          <MessageSquare className="h-3 w-3 text-[#25D366]" />
                          <span>Test WhatsApp Chat</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="px-5 py-3.5 bg-gray-50/80 border-t border-gray-100 rounded-b-2xl flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedVetting((prev) => ({
                        ...prev,
                        [service.id]: !prev[service.id],
                      }))
                    }
                    className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-gray-900 transition"
                  >
                    <span>{isExpanded ? "Hide custom vetting details" : "Custom vetting & validity"}</span>
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Delete action */}
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleDelete(service.id, service.business_name)}
                      title="Permanently remove spam or abusive service"
                      className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    {/* Reject / Pause button */}
                    {service.status !== "paused" && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleReview(service.id, false)}
                        className="px-3.5 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
                      >
                        {isBusy ? "Updating..." : "Pause / Decline"}
                      </button>
                    )}

                    {/* Quick Approve & Publish button */}
                    {service.status !== "active" && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleReview(service.id, true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1B4332] hover:bg-[#143427] text-white text-xs font-extrabold shadow-sm hover:shadow transition disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{isBusy ? "Approving..." : "Approve & Publish"}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Custom Vetting Form */}
                {isExpanded && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault()
                      const f = new FormData(e.currentTarget)
                      await handleReview(service.id, true, {
                        days: Number(f.get("days")) || 90,
                        evidence_reference: String(f.get("evidence") || ""),
                        safety_requirements: String(f.get("safety") || ""),
                        service_hours: String(f.get("hours") || ""),
                      })
                      setExpandedVetting((prev) => ({ ...prev, [service.id]: false }))
                    }}
                    className="p-5 border-t border-gray-100 bg-amber-50/20 space-y-3"
                  >
                    <p className="text-xs font-bold text-gray-900">Custom Vetting &amp; Safety Compliance</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <label className="block">
                        <span className="text-gray-600 font-semibold">Evidence Reference</span>
                        <input
                          name="evidence"
                          defaultValue={`Reviewed on ${new Date().toLocaleDateString("en-GB")}`}
                          required
                          minLength={3}
                          className="mt-1 w-full p-2 border rounded-lg bg-white"
                        />
                      </label>
                      <label className="block">
                        <span className="text-gray-600 font-semibold">Service Hours</span>
                        <input
                          name="hours"
                          defaultValue={service.service_hours || "Mon-Sat 8:00 AM - 6:00 PM"}
                          required
                          className="mt-1 w-full p-2 border rounded-lg bg-white"
                        />
                      </label>
                      <label className="block">
                        <span className="text-gray-600 font-semibold">Valid Days (1-365)</span>
                        <input
                          name="days"
                          type="number"
                          defaultValue={90}
                          min={1}
                          max={365}
                          required
                          className="mt-1 w-full p-2 border rounded-lg bg-white"
                        />
                      </label>
                    </div>
                    <label className="block text-xs">
                      <span className="text-gray-600 font-semibold">Safety &amp; Compliance Notes (min 20 chars)</span>
                      <textarea
                        name="safety"
                        rows={2}
                        defaultValue={
                          service.safety_requirements ||
                          "Identity, category compliance, and direct student WhatsApp safety verified."
                        }
                        minLength={20}
                        required
                        className="mt-1 w-full p-2 border rounded-lg bg-white"
                      />
                    </label>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedVetting((prev) => ({ ...prev, [service.id]: false }))
                        }
                        className="px-3 py-1.5 rounded-lg border text-xs font-semibold text-gray-600 hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isBusy}
                        className="px-4 py-1.5 rounded-lg bg-[#1B4332] text-white text-xs font-extrabold hover:brightness-110"
                      >
                        {isBusy ? "Saving..." : "Save & Approve"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
