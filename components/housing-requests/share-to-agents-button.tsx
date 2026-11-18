"use client";

import { useState } from "react";
import { Check, ExternalLink, MessageCircle } from "lucide-react";
import {
  formatPartnerAgentBroadcastMessage,
  getWhatsAppSendUrl,
  getPartnerAgentsGroupUrl,
} from "@/lib/housing-request-schema";

type ShareToAgentsButtonProps = {
  requestCode: string;
  campusZone: string;
  propertyType: string;
  minBudget: number;
  maxBudget: number;
  moveInTimeline: string;
  extraNotes?: string | null;
  adminWhatsapp?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  showDirectGroupAction?: boolean;
};

export function ShareToAgentsButton({
  requestCode,
  campusZone,
  propertyType,
  minBudget,
  maxBudget,
  moveInTimeline,
  extraNotes,
  adminWhatsapp,
  className = "",
  size = "md",
  showDirectGroupAction = true,
}: ShareToAgentsButtonProps) {
  const [copied, setCopied] = useState(false);
  const [directGroupCopied, setDirectGroupCopied] = useState(false);

  const message = formatPartnerAgentBroadcastMessage({
    request_code: requestCode,
    campus_zone: campusZone,
    property_type: propertyType,
    min_budget: minBudget,
    max_budget: maxBudget,
    move_in_timeline: moveInTimeline,
    extra_notes: extraNotes,
    adminWhatsapp,
  });

  const groupUrl = getPartnerAgentsGroupUrl();

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Copy formatted broadcast text to clipboard as guaranteed fallback
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(message);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch (err) {
      console.warn("Clipboard write failed, opening WhatsApp anyway", err);
    }

    // 2. Open WhatsApp Send URL with the formatted message
    const sendUrl = getWhatsAppSendUrl(message);
    window.open(sendUrl, "_blank", "noopener,noreferrer");
  };

  const handleDropInGroup = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Copy formatted broadcast text to clipboard
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(message);
        setDirectGroupCopied(true);
        setTimeout(() => setDirectGroupCopied(false), 3500);
      }
    } catch (err) {
      console.warn("Clipboard write failed", err);
    }

    // Directly open the Partner Agents & Landlords WhatsApp Group
    window.open(groupUrl, "_blank", "noopener,noreferrer");
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-5 py-3 text-base gap-2.5",
  }[size];

  return (
    <div className={`flex flex-col sm:flex-row items-stretch gap-2 ${className}`}>
      {/* Primary 1-Click WhatsApp Broadcast Button (#1B4332 Forest Green) */}
      <button
        type="button"
        onClick={handleShare}
        title="Format and share this request to WhatsApp (copies message and opens WhatsApp)"
        className={`flex-1 inline-flex items-center justify-center font-bold text-white bg-[#1B4332] hover:bg-[#133024] active:scale-[0.98] rounded-xl shadow-xs transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/50 cursor-pointer ${sizeClasses}`}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>Copied & Opening WhatsApp!</span>
          </>
        ) : (
          <>
            <span className="text-base leading-none">📲</span>
            <span>Share to Agents Group</span>
          </>
        )}
      </button>

      {/* Direct Drop into Partner Agents Group */}
      {showDirectGroupAction && (
        <button
          type="button"
          onClick={handleDropInGroup}
          title="Copies formatted lead and opens the Partner Agents & Landlords group chat directly"
          className="inline-flex items-center justify-center font-bold text-[#1B4332] bg-emerald-100/70 hover:bg-emerald-200/80 active:scale-[0.98] border border-emerald-300 rounded-xl px-3 py-2 text-xs gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-2xs"
        >
          {directGroupCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-700" />
              <span>Copied! Opening Group...</span>
            </>
          ) : (
            <>
              <MessageCircle className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Drop in Group Chat</span>
              <ExternalLink className="w-3 h-3 text-emerald-700 opacity-70" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
