"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Phone,
  MessageCircle,
  ExternalLink,
  Trash2,
  RefreshCw,
  Home,
  MapPin,
  Calendar,
  AlertTriangle,
  UserCheck,
} from "lucide-react";
import { ShareToAgentsButton } from "@/components/housing-requests/share-to-agents-button";
import {
  updateHousingRequestStatus,
  deleteHousingRequest,
} from "@/app/actions/housing-requests";
import { cleanWhatsAppNumber } from "@/lib/housing-request-schema";
import { CAMPUS_ZONES } from "@/lib/constants";
import type { HousingRequest } from "@/types";

type AdminRequestsBoardProps = {
  initialRequests: HousingRequest[];
};

export function AdminRequestsBoard({ initialRequests }: AdminRequestsBoardProps) {
  const [requests, setRequests] = useState<HousingRequest[]>(initialRequests);
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "fulfilled">("open");
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = requests.length;
    const open = requests.filter((r) => r.status === "open").length;
    const fulfilled = requests.filter((r) => r.status === "fulfilled").length;
    const urgent = requests.filter(
      (r) => r.status === "open" && r.move_in_timeline.toLowerCase().includes("urgent")
    ).length;
    return { total, open, fulfilled, urgent };
  }, [requests]);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (zoneFilter !== "all" && r.campus_zone !== zoneFilter) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const inCode = r.request_code.toLowerCase().includes(q);
        const inName = r.student_name.toLowerCase().includes(q);
        const inPhone = r.student_whatsapp ? r.student_whatsapp.includes(q) : false;
        const inZone = r.campus_zone.toLowerCase().includes(q);
        const inType = r.property_type.toLowerCase().includes(q);
        const inNotes = r.extra_notes ? r.extra_notes.toLowerCase().includes(q) : false;
        if (!inCode && !inName && !inPhone && !inZone && !inType && !inNotes) return false;
      }

      return true;
    });
  }, [requests, statusFilter, zoneFilter, search]);

  const handleStatusToggle = async (id: string, currentStatus: "open" | "fulfilled") => {
    const nextStatus = currentStatus === "open" ? "fulfilled" : "open";
    setUpdatingId(id);

    const res = await updateHousingRequestStatus(id, nextStatus);
    setUpdatingId(null);

    if (res.success) {
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: nextStatus } : r))
      );
    } else {
      alert(res.error || "Failed to update status");
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to permanently delete Request #${code}?`)) {
      return;
    }

    setUpdatingId(id);
    const res = await deleteHousingRequest(id);
    setUpdatingId(null);

    if (res.success) {
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } else {
      alert(res.error || "Failed to delete request");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Student Housing Requests
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            1-Click "Share to Partner Agents WhatsApp Group" Broadcast Dashboard
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Leads</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
            Total Requests
          </span>
          <div className="text-2xl font-black text-gray-900 mt-1">{stats.total}</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200/80 shadow-xs bg-linear-to-br from-emerald-50/50 to-white">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
            Active Open Leads
          </span>
          <div className="text-2xl font-black text-[#10B981] mt-1">{stats.open}</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200/80 shadow-xs bg-linear-to-br from-amber-50/50 to-white">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
            Urgent Move-Ins
          </span>
          <div className="text-2xl font-black text-[#F59E0B] mt-1">{stats.urgent}</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
            Fulfilled Matches
          </span>
          <div className="text-2xl font-black text-gray-700 mt-1">{stats.fulfilled}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter("open")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                statusFilter === "open"
                  ? "bg-white text-[#1B4332] shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Open Leads ({stats.open})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                statusFilter === "all"
                  ? "bg-white text-[#1B4332] shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("fulfilled")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                statusFilter === "fulfilled"
                  ? "bg-white text-[#1B4332] shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Fulfilled ({stats.fulfilled})
            </button>
          </div>

          {/* Campus Zone Select */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
              Zone:
            </span>
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            >
              <option value="all">All Zones</option>
              {CAMPUS_ZONES.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, WhatsApp number, request code (#HP-...), or notes..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50/60 pl-10 pr-4 py-2 text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
          />
        </div>
      </div>

      {/* Lead Cards List */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map((item) => {
            const isFulfilled = item.status === "fulfilled";
            const isUrgent = item.move_in_timeline.toLowerCase().includes("urgent");
            const cleanPhone = cleanWhatsAppNumber(item.student_whatsapp);

            return (
              <div
                key={item.id}
                data-request-id={item.id}
                className={`flex flex-col justify-between rounded-2xl border p-5 sm:p-6 transition-all duration-150 bg-white shadow-xs ${
                  isFulfilled
                    ? "border-gray-200 opacity-75 bg-gray-50/40"
                    : "border-gray-200/90 hover:border-emerald-300"
                }`}
              >
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black tracking-wider uppercase px-2.5 py-1 rounded-md bg-[#1B4332]/10 text-[#1B4332] border border-[#1B4332]/20">
                        #{item.request_code}
                      </span>
                      {isFulfilled ? (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-300">
                          Fulfilled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#10B981] border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                          Open Lead
                        </span>
                      )}
                      {isUrgent && !isFulfilled && (
                        <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 animate-pulse">
                          ⚡ Urgent
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-600 font-medium">
                      {new Date(item.created_at).toLocaleDateString("en-NG", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Student Details & Confidential WhatsApp */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-blue-50/70 border border-blue-200/80 p-3.5 rounded-xl">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 block">
                        Student Contact (Admin Broker Only)
                      </span>
                      <h3 className="text-base font-extrabold text-blue-950">
                        {item.student_name}
                      </h3>
                      <div className="font-mono text-xs font-bold text-blue-900 mt-0.5 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-blue-700" />
                        <span>{item.student_whatsapp || "No phone provided"}</span>
                      </div>
                    </div>

                    {item.student_whatsapp && (
                      <a
                        href={`https://wa.me/${cleanPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shrink-0 shadow-xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>DM Student</span>
                      </a>
                    )}
                  </div>

                  {/* Criteria Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <span className="text-gray-600 font-medium block">Preferred Area</span>
                      <strong className="text-gray-900 font-bold text-sm">{item.campus_zone}</strong>
                    </div>

                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <span className="text-gray-600 font-medium block">Lodge Type</span>
                      <strong className="text-gray-900 font-bold text-sm">{item.property_type}</strong>
                    </div>

                    <div className="bg-[#1B4332]/5 p-2.5 rounded-xl border border-[#1B4332]/10 col-span-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[#1B4332] font-bold block text-[11px] uppercase tracking-wider">
                            Annual Budget Range
                          </span>
                          <strong className="text-[#1B4332] font-black text-base">
                            ₦{item.min_budget.toLocaleString("en-NG")} – ₦{item.max_budget.toLocaleString("en-NG")}
                          </strong>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-600 text-[11px] block">Timeline</span>
                          <span className="font-bold text-gray-800 text-xs">
                            {item.move_in_timeline}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {item.extra_notes && (
                    <div className="text-xs bg-amber-50/70 border border-amber-200/80 p-3 rounded-xl text-amber-950">
                      <strong className="font-bold block mb-0.5">Notes:</strong>
                      <p className="leading-relaxed">{item.extra_notes}</p>
                    </div>
                  )}
                </div>

                {/* Actions Bar */}
                <div className="mt-5 pt-4 border-t border-gray-100 space-y-3">
                  {/* 1-Click "Share to Partner Agents Group" Button */}
                  <ShareToAgentsButton
                    requestCode={item.request_code}
                    campusZone={item.campus_zone}
                    propertyType={item.property_type}
                    minBudget={item.min_budget}
                    maxBudget={item.max_budget}
                    moveInTimeline={item.move_in_timeline}
                    extraNotes={item.extra_notes}
                    size="md"
                    className="w-full"
                  />

                  {/* Secondary Management Actions */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      type="button"
                      disabled={updatingId === item.id}
                      onClick={() => handleStatusToggle(item.id, item.status)}
                      className="font-bold text-[#1B4332] hover:underline disabled:opacity-50"
                    >
                      {item.status === "open" ? "✓ Mark Fulfilled" : "↺ Reopen Lead"}
                    </button>

                    <button
                      type="button"
                      disabled={updatingId === item.id}
                      onClick={() => handleDelete(item.id, item.request_code)}
                      className="font-semibold text-red-600 hover:text-red-800 hover:underline flex items-center gap-1 disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 p-6 space-y-3">
          <p className="text-gray-600 font-medium text-sm">
            No housing requests matching your current filters.
          </p>
          {(statusFilter !== "all" || zoneFilter !== "all" || search) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setZoneFilter("all");
                setSearch("");
              }}
              className="text-xs font-bold text-[#1B4332] underline"
            >
              Reset filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
