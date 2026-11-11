"use client";

import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { buildServiceWhatsAppUrl } from "@/lib/service-utils";

export function ServiceWhatsAppLink({ service }: { service: { id: string; business_name: string; whatsapp_number: string } }) {
  return (
    <a
      href={buildServiceWhatsAppUrl(service)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        // A click is only an outbound contact attempt, never a confirmed enquiry or job.
        void createClient().rpc("increment_service_stat", { service_id: service.id, stat_type: "click" });
      }}
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1B4332] px-5 py-3 text-center text-sm font-extrabold text-white transition hover:bg-[#143728] sm:w-auto"
    >
      <MessageCircle className="h-5 w-5" /> Chat with provider on WhatsApp
    </a>
  );
}
