"use client"

import { useMemo, useState, useEffect } from "react"
import { ShieldCheck, Phone, MessageCircle, ShieldAlert, Lock, Info, Check } from "lucide-react"
import type { Listing } from "@/types"
import { buildWhatsAppLink, formatNaira } from "@/lib/utils"
import { recordWhatsAppClick } from "@/app/actions"
import { UNIVERSITIES } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

type ContactCardProps = {
  listing: Listing
}

export default function ContactCard({ listing }: ContactCardProps) {
  const [showPhone, setShowPhone] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  
  const university = UNIVERSITIES.find(u => u.id === listing.university)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })
  }, [supabase])

  const whatsappUrl = useMemo(
    () => buildWhatsAppLink(listing.whatsapp_number, listing.title),
    [listing.whatsapp_number, listing.title]
  )

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault()
      window.location.href = `/login?returnTo=/listing/${listing.id}`
      return
    }
    recordWhatsAppClick(listing.id)
  }

  const handleRevealPhone = () => {
    if (!user) {
      window.location.href = `/login?returnTo=/listing/${listing.id}`
      return
    }
    if (!showPhone) {
      import("@/app/actions").then(actions => actions.recordPhoneReveal(listing.id))
    }
    setShowPhone((v) => !v)
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

          {listing.landlord?.role === "agent" &&
            listing.agent_fee_type &&
            listing.agent_fee_type !== "none" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Info className="w-4 h-4 text-amber-700 shrink-0" />
                  <p className="text-sm font-semibold text-amber-800">Agent Fee</p>
                </div>
                {listing.agent_fee_type === "fixed" && (
                  <p className="text-sm text-amber-700">
                    This listing has an agent fee of {formatNaira(listing.agent_fee_amount ?? 0)}. Discuss directly with the agent.
                  </p>
                )}
                {listing.agent_fee_type === "negotiable" && (
                  <p className="text-sm text-amber-700">
                    Agent fee is negotiable from {formatNaira(listing.agent_fee_amount ?? 0)}. Discuss directly with the agent.
                  </p>
                )}
              </div>
            )}

          {listing.landlord?.role === "agent" && listing.agent_fee_type === "none" && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-700 shrink-0" />
                <p className="text-sm font-semibold text-green-800">No agent fee for this listing</p>
              </div>
            </div>
          )}

          {!loading && !user ? (
            <div className="space-y-3">
              <Link
                href={`/login?returnTo=/listing/${listing.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B4332] px-4 py-3 text-sm font-bold text-white hover:brightness-95 shadow-md transition active:scale-95"
              >
                <Lock className="h-4 w-4" />
                Login to Contact Landlord
              </Link>
              <p className="text-[10px] text-center text-gray-400 font-medium">Authentication required to prevent spam</p>
            </div>
          ) : (
            <>
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
                onClick={handleRevealPhone}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                <Phone className="h-4 w-4" />
                Reveal Phone Number
              </button>
            </>
          )}

          {showPhone && user ? (
            <div className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-800 animate-in fade-in slide-in-from-top-1">
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
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white/95 px-5 py-4 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md">
          <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Price</p>
              <p className="text-xl font-black text-[#1B4332] truncate">
                {formatNaira(listing.price_yearly)}
              </p>
            </div>

            {!loading && !user ? (
              <Link
                href={`/login?returnTo=/listing/${listing.id}`}
                className="flex-1 max-w-[200px] flex items-center justify-center gap-2 rounded-xl bg-[#1B4332] py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/10 transition active:scale-95"
              >
                <Lock className="h-4 w-4" />
                Login to Chat
              </Link>
            ) : (
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
            )}
          </div>
        </div>
        <div className="h-24" />
      </div>
    </>
  )
}


