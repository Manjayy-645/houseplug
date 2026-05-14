"use client"

import { useMemo, useState } from "react"
import { ShieldCheck, Phone, MessageCircle, ShieldAlert } from "lucide-react"
import type { Listing } from "@/types"
import { buildWhatsAppLink, formatNaira } from "@/lib/utils"
import { recordWhatsAppClick } from "@/app/actions"
import { UNIVERSITIES } from "@/lib/constants"

type ContactCardProps = {
  listing: Listing
}

export default function ContactCard({ listing }: ContactCardProps) {
  const [showPhone, setShowPhone] = useState(false)
  const university = UNIVERSITIES.find(u => u.id === listing.university)

  const whatsappUrl = useMemo(
    () => buildWhatsAppLink(listing.whatsapp_number, listing.title),
    [listing.whatsapp_number, listing.title]
  )

  const handleWhatsAppClick = () => {
    recordWhatsAppClick(listing.id)
  }

  const revealedPhone = listing.phone_number ?? ""

  return (
    <>
      <div className="hidden lg:block">
        <div className="sticky top-6 space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="text-left">
            <p className="text-sm font-medium text-gray-600">Price</p>
            <p className="text-3xl font-bold text-[#1B4332]">
              {formatNaira(listing.price_yearly)}
              <span className="ml-2 text-base font-semibold text-gray-700">/ year</span>
            </p>
          </div>

          <p className="text-sm text-gray-600">No agent fees. Pay landlord directly.</p>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            onClick={handleWhatsAppClick}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B4332] px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95"
          >
            <MessageCircle className="h-4 w-4" />
            Contact on WhatsApp
          </a>

          <button
            type="button"
            onClick={() => setShowPhone((v) => !v)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            <Phone className="h-4 w-4" />
            Reveal Phone Number
          </button>

          {showPhone ? (
            <div className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-800">
              <p className="font-medium">Phone number</p>
              <p>{revealedPhone ? revealedPhone : "Phone number not available for this listing."}</p>
            </div>
          ) : null}

          {listing.landlord?.verification_status === "verified" ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <ShieldCheck className="h-4 w-4 text-[#1B4332]" />
              <span>Landlord ID verified by HousePlug</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              <ShieldAlert className="h-4 w-4" />
              <span>Landlord not yet verified — proceed with caution</span>
            </div>
          )}
        </div>
      </div>

      <div className="lg:hidden">
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white/95 px-5 py-4 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md">
          <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Price</p>
              <p className="text-xl font-black text-[#1B4332] truncate">
                {formatNaira(listing.price_yearly)}
              </p>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              onClick={handleWhatsAppClick}
              className="flex-1 max-w-[200px] flex items-center justify-center gap-2 rounded-xl bg-[#1B4332] py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/10 transition active:scale-95"
            >
              <MessageCircle className="h-4 w-4" />
              Chat Landlord
            </a>
          </div>
        </div>
        <div className="h-24" />
      </div>
    </>
  )
}

