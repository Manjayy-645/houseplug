"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  UserCheck,
  UserPlus,
  Phone,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import {
  buildGeneralRoommateWhatsAppLink,
  formatWhatsAppPhone,
} from "@/lib/roommate-matching";

export interface RoommateConnectionButtonProps {
  targetUserId: string;
  targetName?: string;
  campusName?: string;
  targetLodgeTitle?: string | null;
  targetLodgeId?: string | null;
  hasActiveProfile?: boolean;
  profileIssue?: "missing" | "inactive" | "expired" | "consent_missing";
  existingConnection?: {
    id: string;
    requester_id: string;
    recipient_id: string;
    status: "pending" | "accepted" | "declined" | "revoked";
  } | null;
  acceptedPhoneNumber?: string | null;
  currentUserId?: string | null;
}

export function RoommateConnectionButton({
  targetUserId,
  targetName = "this student",
  campusName,
  targetLodgeTitle,
  targetLodgeId,
  hasActiveProfile = true,
  profileIssue,
  existingConnection,
  acceptedPhoneNumber,
  currentUserId,
}: RoommateConnectionButtonProps) {
  const [busy, setBusy] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "none" | "pending" | "accepted" | "declined" | "revoked"
  >(existingConnection?.status || "none");
  const [isRequester, setIsRequester] = useState<boolean>(
    existingConnection
      ? existingConnection.requester_id === currentUserId
      : true,
  );
  const [revealedPhone, setRevealedPhone] = useState<string | null>(
    acceptedPhoneNumber || null,
  );
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
    code?: string;
  } | null>(null);

  // If user does not have an active roommate profile, show guidance
  if (!hasActiveProfile) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 space-y-3.5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-[#F59E0B] flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-gray-900 text-sm">
              {profileIssue === "inactive"
                ? "Your roommate profile is paused"
                : profileIssue === "expired"
                  ? "Your roommate profile has expired"
                  : profileIssue === "consent_missing"
                    ? "Profile visibility consent required"
                    : "Create your profile to connect"}
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              {profileIssue === "inactive"
                ? "Your profile is currently paused. Activate it in your dashboard so other students can view your preferences before connecting."
                : profileIssue === "expired"
                  ? "Your roommate profile has expired. Renew it in your dashboard to connect with other students."
                  : profileIssue === "consent_missing"
                    ? "Turn on visibility consent for your roommate profile so students can see your preferences."
                    : `To connect with ${targetName}, you must create your own roommate profile first. Both students must share their preferences to keep off-campus housing safe and verified.`}
            </p>
          </div>
        </div>
        <div className="pt-1">
          {profileIssue === "missing" ? (
            <Link
              href="/roommates/create"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1B4332] text-white font-bold text-xs hover:brightness-110 transition shadow-xs w-full sm:w-auto"
            >
              <span>Create Your Roommate Profile</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/student/roommate"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1B4332] text-white font-bold text-xs hover:brightness-110 transition shadow-xs w-full sm:w-auto"
            >
              <span>Manage Your Profile</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    );
  }

  // Handle accepting or declining incoming connection request
  const handleResponseAction = async (action: "accept" | "decline") => {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/roommate-connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          target_user_id: targetUserId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (action === "accept") {
          setConnectionStatus("accepted");
          setFeedback({
            type: "success",
            message: `Connection accepted! You can now chat with ${targetName} on WhatsApp.`,
          });
        } else {
          setConnectionStatus("declined");
          setFeedback({
            type: "info",
            message: "Connection request declined.",
          });
        }
      } else {
        setFeedback({
          type: "error",
          message: data.error || "Unable to update connection.",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Network error. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  };

  // Handle initiating a new connection request
  const handleSendRequest = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/roommate-connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request",
          target_user_id: targetUserId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setConnectionStatus("pending");
        setIsRequester(true);
        setFeedback({
          type: "success",
          message:
            data.message ||
            `Connection request sent to ${targetName}! Once accepted, their verified WhatsApp contact will be unlocked.`,
        });
      } else {
        setFeedback({
          type: "error",
          message: data.error || "Could not send connection request.",
          code: data.code,
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Could not send request. Please check your internet connection.",
      });
    } finally {
      setBusy(false);
    }
  };

  // Handle WhatsApp click
  const handleOpenWhatsApp = async () => {
    let phoneToUse = revealedPhone;
    if (!phoneToUse) {
      setBusy(true);
      try {
        const res = await fetch("/api/roommate-connections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "contact",
            target_user_id: targetUserId,
          }),
        });
        const data = await res.json();
        if (res.ok && data.contact) {
          phoneToUse = data.contact;
          setRevealedPhone(data.contact);
        } else {
          setFeedback({
            type: "error",
            message: data.error || "Could not retrieve contact information.",
          });
          setBusy(false);
          return;
        }
      } catch {
        setFeedback({
          type: "error",
          message: "Unable to retrieve phone number.",
        });
        setBusy(false);
        return;
      }
      setBusy(false);
    }

    if (phoneToUse) {
      const waUrl = buildGeneralRoommateWhatsAppLink({
        phone: phoneToUse,
        candidateName: targetName,
        targetLodgeTitle,
        targetLodgeId,
        campusName,
      });
      window.open(waUrl, "_blank");
    }
  };

  // ── 1. ACCEPTED STATE ────────────────────────────────────────────────────────
  if (connectionStatus === "accepted") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 space-y-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full">
              Connected
            </span>
            <h3 className="font-bold text-gray-900 text-sm mt-0.5">
              Connected with {targetName}
            </h3>
          </div>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          Both of you accepted this connection. Direct WhatsApp contact is unlocked so you can discuss teaming up and house hunting.
        </p>

        {revealedPhone && (
          <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs font-semibold text-gray-700 flex items-center justify-between">
            <span>Verified Phone:</span>
            <span className="font-mono text-[#1B4332] font-bold">
              {revealedPhone}
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <button
            onClick={handleOpenWhatsApp}
            disabled={busy}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#1B4332] text-white font-bold text-xs hover:brightness-110 transition shadow-xs"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#F59E0B]" />
            ) : (
              <Phone className="w-4 h-4 text-[#F59E0B]" />
            )}
            <span>Chat on WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </button>
          <Link
            href="/student/connections"
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-bold text-xs hover:bg-gray-50 transition"
          >
            Manage Connections
          </Link>
        </div>
        {feedback && (
          <p className="text-xs font-medium text-emerald-700 mt-2">
            {feedback.message}
          </p>
        )}
      </div>
    );
  }

  // ── 2. PENDING STATE ─────────────────────────────────────────────────────────
  if (connectionStatus === "pending") {
    // If current user is the recipient of the request
    if (!isRequester) {
      return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 space-y-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B] text-white flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                Incoming Request
              </span>
              <h3 className="font-bold text-gray-900 text-sm mt-0.5">
                {targetName} requested to connect with you!
              </h3>
            </div>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Accepting will unlock direct WhatsApp messaging so you can discuss splitting rent and teaming up.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => handleResponseAction("accept")}
              disabled={busy}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1B4332] text-white font-bold text-xs hover:brightness-110 transition shadow-xs disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F59E0B]" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#F59E0B]" />
              )}
              <span>Accept Request</span>
            </button>
            <button
              onClick={() => handleResponseAction("decline")}
              disabled={busy}
              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-bold text-xs hover:bg-gray-50 transition disabled:opacity-50"
            >
              Decline
            </button>
          </div>
          {feedback && (
            <p
              className={`text-xs font-semibold ${
                feedback.type === "error" ? "text-red-700" : "text-gray-700"
              }`}
            >
              {feedback.message}
            </p>
          )}
        </div>
      );
    }

    // Outgoing pending request
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 space-y-3.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1B4332] text-white flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full">
              Request Sent
            </span>
            <h3 className="font-bold text-gray-900 text-sm mt-0.5">
              Awaiting response from {targetName}
            </h3>
          </div>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          You sent a private connection request. Once {targetName} accepts, their verified WhatsApp contact will be unlocked here.
        </p>
        <div className="pt-1">
          <Link
            href="/student/connections"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B4332] hover:underline"
          >
            <span>View all connection requests in dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {feedback && (
          <p className="text-xs font-medium text-emerald-800 mt-2">
            {feedback.message}
          </p>
        )}
      </div>
    );
  }

  // ── 3. DECLINED / REVOKED STATE ──────────────────────────────────────────────
  if (connectionStatus === "declined" || connectionStatus === "revoked") {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 space-y-2">
        <h3 className="font-bold text-gray-800 text-sm">
          {connectionStatus === "declined"
            ? "Connection Request Declined"
            : "Connection Revoked"}
        </h3>
        <p className="text-xs text-gray-500">
          This connection is no longer active. You can browse other roommate listings near campus.
        </p>
        <Link
          href="/roommates"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B4332] hover:underline pt-1"
        >
          <span>Find other roommates</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  // ── 4. INITIAL UNCONNECTED STATE ─────────────────────────────────────────────
  return (
    <div className="space-y-3.5">
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 flex items-center gap-3 text-xs text-gray-600">
        <ShieldCheck className="w-5 h-5 text-[#1B4332] shrink-0" />
        <span className="leading-relaxed">
          Your phone number stays private until both of you accept this connection. Review their profile before requesting.
        </span>
      </div>

      <button
        disabled={busy}
        onClick={handleSendRequest}
        className="w-full py-4 rounded-xl bg-[#1B4332] text-white font-bold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
      >
        {busy ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-[#F59E0B]" />
            <span>Sending connection request...</span>
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4 text-[#F59E0B]" />
            <span>Request a private connection</span>
          </>
        )}
      </button>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
          role="status"
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          {feedback.code === "PROFILE_REQUIRED" && (
            <Link
              href="/roommates/create"
              className="underline text-red-900 font-bold ml-2 shrink-0"
            >
              Create profile
            </Link>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
        <Link
          className="hover:text-gray-900 underline transition-colors"
          href="/student/connections"
        >
          Manage your connections
        </Link>
        <span>Max 10 requests / day</span>
      </div>
    </div>
  );
}
