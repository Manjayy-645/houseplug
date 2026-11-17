"use client";

import { useState } from "react";
import { Share2, Check, ExternalLink } from "lucide-react";
import {
  formatPartnerAgentBroadcastMessage,
  getWhatsAppSendUrl,
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
}: ShareToAgentsButtonProps) {
  const [copied, setCopied] = useState(false);

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

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-5 py-3 text-base gap-2.5",
  }[size];

  return (
    <button
      type="button"
      onClick={handleShare}
      title="Format and share this request to your Partner Agents WhatsApp Group"
      className={`inline-flex items-center justify-center font-bold text-white bg-[#1B4332] hover:bg-[#133024] active:scale-[0.98] rounded-xl shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#1B4332]/50 ${sizeClasses} ${className}`}
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
  );
}
