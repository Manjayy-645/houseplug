"use client";

import { MapPin, Home, Calendar, Clock, Sparkles, MessageCircle, Phone } from "lucide-react";
import { ShareToAgentsButton } from "./share-to-agents-button";
import { AgentClaimButton } from "./agent-claim-button";
import { cleanWhatsAppNumber } from "@/lib/housing-request-schema";
import type { HousingRequest } from "@/types";

type StudentRequestCardProps = {
  request: HousingRequest;
  isAdmin?: boolean;
  onStatusChange?: (id: string, status: "open" | "fulfilled") => void;
  onDelete?: (id: string) => void;
};

export function StudentRequestCard({
  request,
  isAdmin = false,
  onStatusChange,
  onDelete,
}: StudentRequestCardProps) {
  const isFulfilled = request.status === "fulfilled";
  const formattedCreated = new Date(request.created_at).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <article
      data-request-id={request.id}
      className={`relative flex flex-col justify-between rounded-2xl border transition-all duration-200 bg-white shadow-xs hover:shadow-md ${
        isFulfilled ? "border-gray-200 opacity-75 bg-gray-50/50" : "border-gray-200/90 hover:border-emerald-200"
      }`}
    >
      <div className="p-5 sm:p-6 space-y-4">
        {/* Header Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-black tracking-wider uppercase px-2.5 py-1 rounded-md bg-[#1B4332]/10 text-[#1B4332] border border-[#1B4332]/20">
              #{request.request_code}
            </span>
            {isFulfilled ? (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-300">
                Fulfilled
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#10B981] border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                Open Request
              </span>
            )}
          </div>
          <span className="text-xs text-gray-600 font-medium">{formattedCreated}</span>
        </div>

        {/* Student Name */}
        <div>
          <h3 className="text-lg font-extrabold text-[#111827] flex items-center gap-2">
            <span>{request.student_name}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-[#F59E0B] border border-amber-200">
              Verified Student
            </span>
          </h3>
        </div>

        {/* Location & Property Type Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2.5 bg-gray-50/80 p-3 rounded-xl border border-gray-100">
            <MapPin className="w-4 h-4 text-[#1B4332] shrink-0 mt-0.5" />
            <div>
              <span className="text-xs text-gray-600 block font-medium">Preferred Area</span>
              <strong className="text-gray-900 font-bold">{request.campus_zone}</strong>
            </div>
          </div>

          <div className="flex items-start gap-2.5 bg-gray-50/80 p-3 rounded-xl border border-gray-100">
            <Home className="w-4 h-4 text-[#1B4332] shrink-0 mt-0.5" />
            <div>
              <span className="text-xs text-gray-600 block font-medium">Lodge Type</span>
              <strong className="text-gray-900 font-bold">{request.property_type}</strong>
            </div>
          </div>
        </div>

        {/* Budget Highlight */}
        <div className="rounded-xl bg-[#1B4332]/5 border border-[#1B4332]/10 p-3.5 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#1B4332]/80 block">
              Student's Annual Budget
            </span>
            <div className="text-base sm:text-lg font-black text-[#1B4332]">
              ₦{request.min_budget.toLocaleString("en-NG")} – ₦{request.max_budget.toLocaleString("en-NG")}
              <span className="text-xs font-medium text-gray-600 ml-1">/ year</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-medium text-gray-600 block">Move-In</span>
            <div className="text-xs sm:text-sm font-bold text-gray-800 flex items-center justify-end gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>{request.move_in_timeline}</span>
            </div>
          </div>
        </div>

        {/* Extra Notes */}
        {request.extra_notes ? (
          <div className="text-xs bg-amber-50/60 border border-amber-200/70 p-3 rounded-xl text-amber-900">
            <strong className="font-bold text-amber-950 block mb-1">📝 Extra Notes &amp; Preferences:</strong>
            <p className="line-clamp-3 leading-relaxed">{request.extra_notes}</p>
          </div>
        ) : (
          <div className="text-xs bg-gray-50 border border-gray-100 p-2.5 rounded-xl text-gray-600 italic">
            Standard requirement: Neat, secure compound with regular water.
          </div>
        )}

        {/* Admin Confidential Contact */}
        {isAdmin && request.student_whatsapp && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <strong className="font-bold text-blue-900 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-blue-700" />
                Student Contact (Admin Only):
              </strong>
              <a
                href={`https://wa.me/${cleanWhatsAppNumber(request.student_whatsapp)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-blue-700 hover:underline flex items-center gap-1"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                DM Student
              </a>
            </div>
            <p className="font-mono text-blue-950 font-bold">{request.student_whatsapp}</p>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="p-4 sm:p-5 bg-gray-50/80 border-t border-gray-100 rounded-b-2xl flex flex-col gap-2.5">
        {/* Public Landlord/Agent Claim Button */}
        {!isFulfilled && (
          <AgentClaimButton
            requestCode={request.request_code}
            campusZone={request.campus_zone}
            propertyType={request.property_type}
            size="md"
            className="w-full"
          />
        )}

        {/* Admin 1-Click WhatsApp Broadcast Button */}
        {isAdmin && (
          <div className="space-y-2 pt-1 border-t border-gray-200">
            <ShareToAgentsButton
              requestCode={request.request_code}
              campusZone={request.campus_zone}
              propertyType={request.property_type}
              minBudget={request.min_budget}
              maxBudget={request.max_budget}
              moveInTimeline={request.move_in_timeline}
              extraNotes={request.extra_notes}
              className="w-full"
            />

            <div className="flex items-center justify-between pt-1 text-xs">
              {onStatusChange && (
                <button
                  type="button"
                  onClick={() => onStatusChange(request.id, isFulfilled ? "open" : "fulfilled")}
                  className="font-bold text-gray-600 hover:text-gray-900 hover:underline"
                >
                  {isFulfilled ? "Reopen Request" : "Mark as Fulfilled"}
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete request #${request.request_code}?`)) {
                      onDelete(request.id);
                    }
                  }}
                  className="font-semibold text-red-600 hover:text-red-800 hover:underline"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
