"use client"

import { useMemo, useState } from "react"
import { ShieldCheck, Phone, ShieldAlert, Users } from "lucide-react"
import type { Listing } from "@/types"
import { buildWhatsAppLink, formatNaira } from "@/lib/utils"
import { recordWhatsAppClick, recordPhoneReveal } from "@/app/actions"
import { createClient } from "@/lib/supabase/client"

const WhatsAppIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.052 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
)

type ContactCardProps = {
  listing: Listing
}

export default function ContactCard({ listing }: ContactCardProps) {
  const [showPhone, setShowPhone] = useState(false)

  const revealedPhone = listing.phone_number || listing.whatsapp_number || ""
  const isVerified = listing.landlord?.verification_status === "verified"

  const whatsappUrl = useMemo(
    () => buildWhatsAppLink(listing.whatsapp_number, listing.title, listing.id),
    [listing.whatsapp_number, listing.title, listing.id]
  )

  const handleWhatsAppClick = () => {
    void recordWhatsAppClick(listing.id)
    try {
      const supabase = createClient()
      void supabase.from("activity_events").insert({
        event_type: "whatsapp_click",
        listing_id: listing.id,
        area: listing.area,
        university: listing.university
      })
    } catch {
      // Best-effort tracking
    }
  }

  const handleRevealPhone = () => {
    if (!showPhone) {
      void recordPhoneReveal(listing.id)
    }
    setShowPhone((v) => !v)
  }

  const handlePhoneCall = () => {
    void recordPhoneReveal(listing.id)
  }

  return (
    <>
      {/* ── Desktop In-Page Card (Sticky in Right Sidebar) ── */}
      <div className="hidden lg:block">
        <div className="sticky top-24 space-y-4 rounded-2xl border border-gray-200/90 bg-white p-6 shadow-sm">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Price</p>
              <p className="text-3xl font-black text-[#1B4332]">
                {formatNaira(listing.price_yearly)}
                <span className="ml-1.5 text-sm font-semibold text-gray-500">/ year</span>
              </p>
            </div>
            {isVerified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-100">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Verified
              </span>
            )}
          </div>

          {/* Roommate Split Callout */}
          <a
            href="#split-rent-section"
            className="group block rounded-xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/80 to-amber-50/60 p-3 hover:border-emerald-300 transition-all text-left"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#1B4332]">
                <Users className="w-3.5 h-3.5 text-[#F59E0B]" />
                Rent too high? Split it!
              </span>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded">
                Save 50%
              </span>
            </div>
            <p className="text-[11px] text-gray-600 mt-1">
              Pay just <strong className="text-emerald-800 font-bold">{formatNaira(Math.round(listing.price_yearly / 2))}</strong>/yr with a roommate.
              <span className="text-emerald-700 font-bold ml-1 group-hover:underline inline-flex items-center">
                Calculate split &rarr;
              </span>
            </p>
          </a>

          <div className="space-y-2.5 pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWhatsAppClick}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] px-4 py-3.5 text-sm font-extrabold text-white shadow-md shadow-[#25D366]/25 transition-all"
            >
              <WhatsAppIcon className="h-5 w-5 fill-white shrink-0" />
              Contact on WhatsApp
            </a>

            <button
              type="button"
              onClick={handleRevealPhone}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all"
            >
              <Phone className="h-4 w-4 text-gray-600" />
              {showPhone ? "Hide Phone Number" : "Reveal Phone Number"}
            </button>
          </div>

          {showPhone && (
            <div className="rounded-xl bg-gray-50 p-3.5 text-sm text-gray-800 border border-gray-100 animate-in fade-in slide-in-from-top-1">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Landlord Phone</p>
              <a 
                href={`tel:${revealedPhone}`} 
                onClick={handlePhoneCall}
                className="text-base font-extrabold text-[#1B4332] hover:underline mt-0.5 block tracking-tight"
              >
                {revealedPhone || "Not available"}
              </a>
            </div>
          )}

          <div className="pt-2">
            {isVerified ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 text-xs font-medium text-emerald-800">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Landlord ID &amp; property verified by HousePlug</span>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 rounded-xl border border-amber-100 bg-amber-50/70 p-3 text-xs font-medium text-amber-800">
                <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Unverified landlord &mdash; inspect in person before payment</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile In-Page Card (Visible in page flow) ── */}
      <div className="lg:hidden rounded-2xl border border-gray-200/90 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Price</p>
            <p className="text-2xl font-black text-[#1B4332]">
              {formatNaira(listing.price_yearly)}
              <span className="text-xs font-normal text-gray-500 ml-1">/ year</span>
            </p>
          </div>
          {isVerified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-100">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Verified
            </span>
          )}
        </div>

        {/* Roommate Split Callout */}
        <a
          href="#split-rent-section"
          className="group block rounded-xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/80 to-amber-50/60 p-3 hover:border-emerald-300 transition-all text-left"
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#1B4332]">
              <Users className="w-3.5 h-3.5 text-[#F59E0B]" />
              Rent too high? Split it!
            </span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded">
              Save 50%
            </span>
          </div>
          <p className="text-[11px] text-gray-600 mt-1">
            Pay just <strong className="text-emerald-800 font-bold">{formatNaira(Math.round(listing.price_yearly / 2))}</strong>/yr with a roommate.
            <span className="text-emerald-700 font-bold ml-1 group-hover:underline inline-flex items-center">
              Calculate split &rarr;
            </span>
          </p>
        </a>

        <div className="space-y-2.5">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWhatsAppClick}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.98] px-4 py-3.5 text-base font-extrabold text-white shadow-md shadow-[#25D366]/25 transition-all"
          >
            <WhatsAppIcon className="h-5 w-5 fill-white shrink-0" />
            Chat on WhatsApp
          </a>

          {revealedPhone && (
            <div className="flex gap-2">
              <a
                href={`tel:${revealedPhone}`}
                onClick={handlePhoneCall}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 active:scale-[0.98] py-2.5 px-3 text-sm font-semibold text-gray-700 transition-all"
              >
                <Phone className="h-4 w-4 text-gray-600" />
                Call Landlord
              </a>
              <button
                type="button"
                onClick={handleRevealPhone}
                className="px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 hover:bg-gray-100 active:scale-[0.98] transition-all"
              >
                {showPhone ? "Hide" : "Show Number"}
              </button>
            </div>
          )}
        </div>

        {showPhone && (
          <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-800 border border-gray-100 animate-in fade-in slide-in-from-top-1 text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Direct Phone Number</p>
            <a 
              href={`tel:${revealedPhone}`} 
              onClick={handlePhoneCall}
              className="text-base font-extrabold text-[#1B4332] hover:underline mt-0.5 block"
            >
              {revealedPhone}
            </a>
          </div>
        )}

        <div className="pt-1">
          {isVerified ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/70 p-2.5 text-xs font-medium text-emerald-800">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Landlord ID &amp; property verified by HousePlug</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50/70 p-2.5 text-xs font-medium text-amber-800">
              <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Unverified landlord &mdash; pay only after personal inspection</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile Sticky Floating Bottom Bar ── */}
      <div className="lg:hidden">
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200/80 bg-white/95 px-4 sm:px-6 py-3.5 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto max-w-lg flex items-center justify-between gap-3.5 sm:gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Price</span>
                <a
                  href="#split-rent-section"
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md hover:bg-amber-100 transition-colors"
                >
                  <Users className="w-3 h-3 text-[#F59E0B] shrink-0" />
                  <span>Split: {formatNaira(Math.round(listing.price_yearly / 2))}</span>
                </a>
              </div>
              <p className="text-xl font-black text-[#1B4332] tracking-tight truncate">
                {formatNaira(listing.price_yearly)}
                <span className="text-xs font-medium text-gray-500 ml-1">/yr</span>
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {revealedPhone && (
                <a
                  href={`tel:${revealedPhone}`}
                  onClick={handlePhoneCall}
                  className="h-12 w-12 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-gray-100 active:scale-95 flex items-center justify-center text-gray-700 shadow-sm transition-all"
                  title="Call Landlord"
                  aria-label="Call Landlord"
                >
                  <Phone className="h-5 w-5 text-gray-700" />
                </a>
              )}

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleWhatsAppClick}
                className="h-12 flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:scale-95 px-4 sm:px-5 text-sm sm:text-base font-extrabold text-white shadow-lg shadow-[#25D366]/25 transition-all"
              >
                <WhatsAppIcon className="h-5 w-5 fill-white shrink-0" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
        {/* Spacer so bottom of page content isn't covered by sticky bar */}
        <div className="h-28" />
      </div>
    </>
  )
}
