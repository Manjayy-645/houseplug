import { MessageSquare } from "lucide-react";
import { getAgentClaimWhatsAppUrl } from "@/lib/housing-request-schema";

type AgentClaimButtonProps = {
  requestCode: string;
  campusZone: string;
  propertyType: string;
  adminWhatsapp?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

export function AgentClaimButton({
  requestCode,
  campusZone,
  propertyType,
  adminWhatsapp,
  className = "",
  size = "md",
}: AgentClaimButtonProps) {
  const href = getAgentClaimWhatsAppUrl(
    requestCode,
    campusZone,
    propertyType,
    adminWhatsapp
  );

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-5 py-3 text-base gap-2.5",
  }[size];

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="DM HousePlug Admin to claim this lead and submit photos"
      className={`inline-flex items-center justify-center font-bold text-[#1B4332] bg-emerald-50 hover:bg-emerald-100/90 active:scale-[0.98] border border-emerald-300 rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-center ${sizeClasses} ${className}`}
    >
      <MessageSquare className="w-4 h-4 text-[#10B981] shrink-0" />
      <span>I Have a Matching Lodge (WhatsApp)</span>
    </a>
  );
}
