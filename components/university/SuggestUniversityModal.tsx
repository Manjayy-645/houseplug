"use client"

import { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { School, X, CheckCircle, Loader2 } from "lucide-react"
import { suggestUniversity } from "@/app/actions/suggest-university"

interface SuggestUniversityModalProps {
  isOpen: boolean
  onClose: () => void
  initialUniversityName?: string
}

export function SuggestUniversityModal({ isOpen, onClose, initialUniversityName = "" }: SuggestUniversityModalProps) {
  const [universityName, setUniversityName] = useState(initialUniversityName)
  const [campusArea, setCampusArea] = useState("")
  const [role, setRole] = useState<"student" | "landlord">("student")
  const [contactInfo, setContactInfo] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    
    if (!universityName.trim() || !contactInfo.trim()) {
      setError("Please fill in all required fields.")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await suggestUniversity({
        universityName,
        campusArea,
        role,
        contactInfo
      })

      if (result.success) {
        setIsSubmitted(true)
      } else {
        setError(result.error || "Failed to submit request.")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      // Reset state when modal is closed
      setTimeout(() => {
        setIsSubmitted(false)
        setUniversityName(initialUniversityName)
        setCampusArea("")
        setRole("student")
        setContactInfo("")
        setError("")
      }, 300) // wait for animation
      onClose()
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-xl z-50 p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          
          <div className="absolute right-4 top-4">
            <Dialog.Close className="rounded-full p-1.5 hover:bg-gray-100 transition-colors text-gray-500">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          {isSubmitted ? (
            <div className="flex flex-col items-center text-center py-6">
              <div className="w-16 h-16 rounded-full bg-[#10B981]/10 flex items-center justify-center mb-6">
                <CheckCircle className="w-11 h-11 text-[#10B981]" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Campus Request Received</h2>
              <p className="text-sm text-gray-500 max-w-[280px] mx-auto">
                Thank you for letting us know! As soon as we inspect and verify student lodges at {universityName || "your university"}, we will notify you.
              </p>
              <button
                onClick={() => handleOpenChange(false)}
                className="mt-8 bg-gray-100 text-gray-900 hover:bg-gray-200 w-full py-2.5 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#1B4332]/10 flex items-center justify-center">
                  <School className="w-5 h-5 text-[#1B4332]" />
                </div>
                <div>
                  <Dialog.Title className="text-lg font-bold text-gray-900">Suggest Your Campus</Dialog.Title>
                  <Dialog.Description className="text-xs text-gray-500 mt-0.5">
                    We're expanding verified student housing across Nigeria. Let us know where you study so we can launch there next.
                  </Dialog.Description>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">University Name *</label>
                  <input
                    type="text"
                    required
                    value={universityName}
                    onChange={(e) => setUniversityName(e.target.value)}
                    placeholder="e.g. FUTO, UNILAG"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Campus Area / Town (Optional)</label>
                  <input
                    type="text"
                    value={campusArea}
                    onChange={(e) => setCampusArea(e.target.value)}
                    placeholder="e.g. Ihiagwa or Town Campus"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">I am a...</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole("student")}
                      className={`px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                        role === "student" 
                          ? "bg-[#1B4332] text-white" 
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Student looking for housing
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("landlord")}
                      className={`px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                        role === "landlord" 
                          ? "bg-[#1B4332] text-white" 
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Landlord / Agent with lodges
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">WhatsApp Number or Email *</label>
                  <input
                    type="text"
                    required
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    placeholder="Your contact info"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">We will only notify you once verified lodges launch on your campus.</p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#1B4332] text-white hover:bg-[#1B4332]/90 disabled:opacity-50 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Campus Request"
                  )}
                </button>
              </form>
            </>
          )}

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
