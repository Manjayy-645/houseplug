"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, CheckCircle2, XCircle, ShieldBan, Trash2, Loader2, ExternalLink } from "lucide-react";
import { formatWhatsAppPhone } from "@/lib/roommate-matching";

export function ConnectionActions({
  target,
  status,
  incoming,
  targetName = "Student",
}: {
  target: string;
  status: string;
  incoming: boolean;
  targetName?: string;
}) {
  const router = useRouter();
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [revealedPhone, setRevealedPhone] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    setBusyAction(action);
    setMsg(null);
    try {
      const r = await fetch("/api/roommate-connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, target_user_id: target }),
      });
      const d = await r.json();

      if (r.ok) {
        if (action === "contact" && d.contact) {
          setRevealedPhone(d.contact);
          const normalized = formatWhatsAppPhone(d.contact);
          const text = encodeURIComponent(`Hi ${targetName}, we connected on HousePlug regarding roommates!`);
          window.open(`https://wa.me/${normalized}?text=${text}`, "_blank");
          setMsg({
            type: "success",
            text: `WhatsApp unlocked: ${d.contact}`,
          });
        } else if (action === "accept") {
          setMsg({ type: "success", text: "Connection accepted! You can now chat on WhatsApp." });
        } else if (action === "decline") {
          setMsg({ type: "info", text: "Connection declined." });
        } else if (action === "revoke") {
          setMsg({ type: "info", text: "Connection revoked." });
        } else if (action === "block") {
          setMsg({ type: "info", text: "Student blocked." });
        } else {
          setMsg({ type: "success", text: "Updated successfully." });
        }
        router.refresh();
      } else {
        setMsg({ type: "error", text: d.error || "Action failed." });
      }
    } catch {
      setMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2.5 items-center">
        {status === "accepted" && (
          <>
            <button
              disabled={busyAction !== null}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1B4332] text-white font-bold text-xs hover:brightness-110 transition shadow-xs disabled:opacity-50"
              onClick={() => handleAction("contact")}
            >
              {busyAction === "contact" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F59E0B]" />
              ) : (
                <Phone className="w-3.5 h-3.5 text-[#F59E0B]" />
              )}
              <span>Chat on WhatsApp</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </button>

            <button
              disabled={busyAction !== null}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-xs hover:bg-gray-50 transition disabled:opacity-50"
              onClick={() => handleAction("revoke")}
            >
              {busyAction === "revoke" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5 text-gray-500" />
              )}
              <span>Revoke Access</span>
            </button>

            <button
              disabled={busyAction !== null}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-transparent text-gray-400 hover:text-red-600 text-xs font-semibold hover:bg-red-50 transition disabled:opacity-50 ml-auto"
              onClick={() => handleAction("block")}
            >
              <ShieldBan className="w-3.5 h-3.5" />
              <span>Block</span>
            </button>
          </>
        )}

        {status === "pending" && incoming && (
          <>
            <button
              disabled={busyAction !== null}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1B4332] text-white font-bold text-xs hover:brightness-110 transition shadow-xs disabled:opacity-50"
              onClick={() => handleAction("accept")}
            >
              {busyAction === "accept" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F59E0B]" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#F59E0B]" />
              )}
              <span>Accept Request</span>
            </button>

            <button
              disabled={busyAction !== null}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-xs hover:bg-gray-50 transition disabled:opacity-50"
              onClick={() => handleAction("decline")}
            >
              {busyAction === "decline" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-gray-500" />
              )}
              <span>Decline</span>
            </button>

            <button
              disabled={busyAction !== null}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-transparent text-gray-400 hover:text-red-600 text-xs font-semibold hover:bg-red-50 transition disabled:opacity-50 ml-auto"
              onClick={() => handleAction("block")}
            >
              <ShieldBan className="w-3.5 h-3.5" />
              <span>Block</span>
            </button>
          </>
        )}

        {status === "pending" && !incoming && (
          <>
            <button
              disabled={busyAction !== null}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-xs hover:bg-gray-50 transition disabled:opacity-50"
              onClick={() => handleAction("revoke")}
            >
              {busyAction === "revoke" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5 text-gray-500" />
              )}
              <span>Cancel Request</span>
            </button>

            <button
              disabled={busyAction !== null}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-transparent text-gray-400 hover:text-red-600 text-xs font-semibold hover:bg-red-50 transition disabled:opacity-50 ml-auto"
              onClick={() => handleAction("block")}
            >
              <ShieldBan className="w-3.5 h-3.5" />
              <span>Block</span>
            </button>
          </>
        )}

        {(status === "declined" || status === "revoked") && (
          <button
            disabled={busyAction !== null}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-transparent text-gray-400 hover:text-red-600 text-xs font-semibold hover:bg-red-50 transition disabled:opacity-50"
            onClick={() => handleAction("block")}
          >
            <ShieldBan className="w-3.5 h-3.5" />
            <span>Block</span>
          </button>
        )}
      </div>

      {revealedPhone && (
        <div className="text-xs text-emerald-800 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200 flex items-center justify-between">
          <span>WhatsApp number:</span>
          <span className="font-mono font-bold">{revealedPhone}</span>
        </div>
      )}

      {msg && (
        <p
          role="status"
          className={`text-xs font-semibold ${
            msg.type === "error"
              ? "text-red-600"
              : msg.type === "success"
                ? "text-emerald-700"
                : "text-gray-600"
          }`}
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}
