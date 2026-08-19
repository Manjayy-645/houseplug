"use client"

import { Phone, AlertCircle } from "lucide-react"
import { useState } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

export function RoommateContactButton({
  phoneNumber,
  firstName,
  currentUserRole
}: {
  phoneNumber: string
  firstName: string
  currentUserRole: string | null
}) {
  const [showRoleModal, setShowRoleModal] = useState(false)

  const handleConnect = () => {
    if (currentUserRole !== "student") {
      setShowRoleModal(true)
      return
    }

    let phone = phoneNumber
    if (phone.startsWith("0")) {
      phone = "234" + phone.substring(1)
    } else if (!phone.startsWith("234")) {
      phone = "234" + phone
    }

    const message = encodeURIComponent(`Hi ${firstName}, I saw your roommate profile on HousePlug!`)
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank")
  }

  return (
    <>
      <button
        onClick={handleConnect}
        className="w-full py-4 rounded-xl bg-[#1B4332] text-white font-bold text-base hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-md"
      >
        <Phone className="h-5 w-5 text-[#F59E0B]" /> Connect on WhatsApp
      </button>

      {showRoleModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative text-center">
            <button
              onClick={() => setShowRoleModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mb-5">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Students Only</h3>
            <p className="text-gray-500 text-sm mb-3">
              This feature is exclusively for <span className="font-bold text-gray-700">student accounts</span>.
              Roommate matching is a student-to-student experience on HousePlug.
            </p>
            <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-8">
              <p className="text-red-700 text-xs font-semibold">
                Your current account type does not have permission to contact roommate listings.
                If you're a student, please sign up with a student account.
              </p>
            </div>
            <button
              onClick={() => setShowRoleModal(false)}
              className="w-full py-3 rounded-xl border border-gray-200 font-bold text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
