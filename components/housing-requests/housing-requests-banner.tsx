"use client";

import { useState } from "react";
import { PlusCircle, Search, Sparkles } from "lucide-react";
import { PostRequestModal } from "./post-request-modal";

type HousingRequestsBannerProps = {
  className?: string;
  variant?: "default" | "compact" | "hero";
};

export function HousingRequestsBanner({
  className = "",
  variant = "default",
}: HousingRequestsBannerProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (variant === "compact") {
    return (
      <>
        <div
          className={`flex items-center justify-between p-4 rounded-2xl bg-linear-to-r from-emerald-50 via-amber-50/40 to-emerald-50 border border-emerald-200 ${className}`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📢</span>
            <div>
              <p className="text-xs sm:text-sm font-bold text-gray-900">
                Can't find your exact lodge?
              </p>
              <p className="text-[11px] text-gray-600">
                Post a free request and our partner agents will search for you.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-[#1B4332] text-white text-xs font-bold hover:bg-[#133024] transition-colors shrink-0 cursor-pointer shadow-xs"
          >
            Post Free Request
          </button>
        </div>
        <PostRequestModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-3xl bg-linear-to-br from-[#1B4332] via-[#16382a] to-[#0c1f17] text-white p-6 sm:p-8 shadow-lg border border-[#1B4332]/40 ${className}`}
      >
        {/* Subtle decorative background circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#F59E0B]/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-[#10B981]/15 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>100% Free Student Service</span>
            </div>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
              Can't find your exact lodge?
            </h3>
            <p className="text-xs sm:text-sm text-gray-200/90 leading-relaxed">
              Don't stress walking under the hot sun. Post your preferred lodge type, campus area, and budget. We broadcast your request directly to verified partner agents who have vacant rooms!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#F59E0B] hover:bg-[#d98b06] active:scale-[0.98] text-[#111827] font-extrabold text-sm shadow-md transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Post a Free Housing Request</span>
            </button>
          </div>
        </div>
      </div>

      <PostRequestModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
