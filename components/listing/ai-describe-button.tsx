"use client"

import { useState } from "react"
import Link from "next/link"
import { Sparkles, Lock, Loader2, X } from "lucide-react"

type Props = {
  isPro: boolean
  // Returns the current listing fields to send as context for generation.
  getPayload: () => Record<string, unknown>
  // Called with the generated description to write back into the form.
  onApply: (text: string) => void
}

export function AiDescribeButton({ isPro, getPayload, onApply }: Props) {
  const [loading, setLoading] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  const handleClick = async () => {
    setNote(null)
    if (!isPro) {
      setShowUpgrade(true)
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/ai/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(getPayload()),
      })
      const data = await res.json().catch(() => ({}))

      if (res.status === 403 && data.error === "pro_required") {
        setShowUpgrade(true)
        return
      }
      if (!res.ok) {
        setNote(data.message || "Couldn't generate a description right now.")
        return
      }
      if (data.description) onApply(data.description)
    } catch {
      setNote("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#1B4332]/20 bg-[#1B4332]/5 px-3 py-1.5 text-xs font-bold text-[#1B4332] transition hover:bg-[#1B4332]/10 disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        Improve with AI
        {!isPro && <Lock className="h-3 w-3" />}
      </button>

      {note && <p className="mt-1 text-xs text-amber-600">{note}</p>}

      {showUpgrade && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={() => setShowUpgrade(false)}>
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowUpgrade(false)}
              className="ml-auto flex rounded-lg p-1 text-gray-400 transition hover:text-gray-600"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1B4332]/10">
              <Sparkles className="h-6 w-6 text-[#1B4332]" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-gray-900">AI descriptions are a Pro feature</h3>
            <p className="mt-2 text-sm text-gray-500">
              Upgrade to Pro to let AI write polished, student-friendly listing descriptions for you.
            </p>
            <Link
              href="/landlord/subscription"
              className="mt-5 inline-block rounded-xl bg-[#F59E0B] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-110 active:scale-95"
            >
              Upgrade to Pro
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
