"use client";

import { useState, useMemo } from "react";
import { PlusCircle, Search, HelpCircle, ShieldCheck, Zap, ExternalLink } from "lucide-react";
import { StudentRequestCard } from "./student-request-card";
import { RequestsFilterBar } from "./requests-filter-bar";
import { PostRequestModal } from "./post-request-modal";
import type { HousingRequest } from "@/types";

type PublicRequestsBoardProps = {
  initialRequests: HousingRequest[];
  isAdmin?: boolean;
};

export function PublicRequestsBoard({
  initialRequests,
  isAdmin = false,
}: PublicRequestsBoardProps) {
  const [requests, setRequests] = useState<HousingRequest[]>(initialRequests);
  const [modalOpen, setModalOpen] = useState(false);

  // Filters state
  const [zone, setZone] = useState("all");
  const [propertyType, setPropertyType] = useState("all");
  const [timeline, setTimeline] = useState("all");
  const [search, setSearch] = useState("");

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (zone !== "all" && r.campus_zone !== zone) return false;
      if (propertyType !== "all" && r.property_type !== propertyType) return false;
      if (timeline !== "all" && r.move_in_timeline !== timeline) return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const inCode = r.request_code.toLowerCase().includes(q);
        const inZone = r.campus_zone.toLowerCase().includes(q);
        const inType = r.property_type.toLowerCase().includes(q);
        const inNotes = r.extra_notes ? r.extra_notes.toLowerCase().includes(q) : false;
        if (!inCode && !inZone && !inType && !inNotes) return false;
      }

      return true;
    });
  }, [requests, zone, propertyType, timeline, search]);

  const handleResetFilters = () => {
    setZone("all");
    setPropertyType("all");
    setTimeline("all");
    setSearch("");
  };

  const handleSuccess = (newCode: string) => {
    // When a student posts a request, trigger reload or add placeholder
    // The server revalidates paths, and page will refresh smoothly
    window.location.reload();
  };

  return (
    <div className="space-y-8">
      {/* Top CTA Row & Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-gray-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-[#111827]">
            Active Student Lodge Requests
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            Verified students searching for off-campus housing near Port Harcourt campuses.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1B4332] hover:bg-[#133024] active:scale-[0.98] text-white font-extrabold text-sm shadow-sm transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-[#F59E0B]" />
          <span>Post a Free Lodge Request</span>
        </button>
      </div>

      {/* Filter Bar */}
      <RequestsFilterBar
        zone={zone}
        propertyType={propertyType}
        timeline={timeline}
        search={search}
        onZoneChange={setZone}
        onPropertyTypeChange={setPropertyType}
        onTimelineChange={setTimeline}
        onSearchChange={setSearch}
        onReset={handleResetFilters}
        totalCount={filteredRequests.length}
      />

      {/* Requests Grid */}
      {filteredRequests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequests.map((req) => (
            <StudentRequestCard
              key={req.id}
              request={req}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-gray-200/80 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#1B4332] flex items-center justify-center mx-auto text-2xl">
            🔍
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-extrabold text-gray-900">
              No matching housing requests found
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              {requests.length === 0
                ? "No student requests have been posted yet. Be the first student to post your requirements for free!"
                : "Try adjusting your filter options or clearing the search box."}
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            {(zone !== "all" || propertyType !== "all" || timeline !== "all" || search) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Clear all filters
              </button>
            )}
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#1B4332] text-white text-xs font-bold hover:bg-[#133024] shadow-xs"
            >
              Post a Free Request Now
            </button>
          </div>
        </div>
      )}

      {/* How It Works Explainer for Students and Landlords */}
      <section className="rounded-3xl bg-linear-to-br from-[#1B4332]/5 to-[#F59E0B]/5 border border-gray-200 p-6 sm:p-8 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <span className="text-[11px] font-bold text-[#1B4332] uppercase tracking-wider">
            Clear &amp; Transparent
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-[#111827]">
            How the Housing Request Board Works
          </h3>
          <p className="text-xs text-gray-500">
            Connecting students seeking lodges with verified partner agents in minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-xl bg-[#1B4332] text-white flex items-center justify-center font-black text-sm">
              1
            </div>
            <h4 className="text-sm font-bold text-gray-900">1. Student Submits Free Request</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Tell us your campus area (Choba, Aluu, etc.), budget range, and timeline. No fee is ever required.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-xl bg-[#F59E0B] text-white flex items-center justify-center font-black text-sm">
              2
            </div>
            <h4 className="text-sm font-bold text-gray-900">2. Instant Broadcast to Partner Agents</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Admin formats and shares the request with verified agents on WhatsApp without exposing private contact info.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2">
            <div className="w-8 h-8 rounded-xl bg-[#10B981] text-white flex items-center justify-center font-black text-sm">
              3
            </div>
            <h4 className="text-sm font-bold text-gray-900">3. Direct Photos &amp; Inspection</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Agents with matching vacant lodges submit photos directly to HousePlug brokers, who connect the student to inspect safely.
            </p>
          </div>
        </div>
      </section>

      {/* Landlord & Partner Agent Network CTA */}
      <div className="bg-linear-to-r from-emerald-50 via-white to-amber-50/60 rounded-3xl border border-emerald-200/90 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#1B4332] text-xs font-bold uppercase tracking-wider">
            <span>🏘️</span>
            <span>For Landlords &amp; Off-Campus Agents</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-[#111827]">
            Got vacant lodges near UniPort, RSU, or IAUE?
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Join our official Partner Agents &amp; Landlords WhatsApp Channel to receive student accommodation requests directly, claim qualified leads, and fill vacant rooms faster.
          </p>
        </div>

        <a
          href="https://chat.whatsapp.com/KmewWrx2i9hCgsTCHoPGgU"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#1B4332] hover:bg-[#133024] active:scale-[0.98] text-white font-extrabold text-sm shadow-md transition-all shrink-0 w-full md:w-auto"
        >
          <span className="text-base leading-none">📲</span>
          <span>Join Partner Agents Group</span>
          <ExternalLink className="w-4 h-4 text-emerald-300" />
        </a>
      </div>

      {/* Modal */}
      <PostRequestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
