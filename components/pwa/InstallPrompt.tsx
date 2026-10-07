"use client"

import { useState, useEffect } from "react"
import { Download, Share, PlusSquare, X } from "lucide-react"

export function InstallPrompt() {
  const [isVisible, setIsVisible] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in navigator && (navigator as any).standalone)
    if (isStandalone) return

    // Check dismissal cooldown (14 days)
    const dismissedDate = localStorage.getItem('houseplug_pwa_dismissed')
    if (dismissedDate) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedDate)) / (1000 * 60 * 60 * 24)
      if (daysSinceDismissed < 14) return
    }

    // iOS detection
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
    // Prevent prompt in webviews (WhatsApp, IG)
    const isWebview = /instagram|whatsapp|wv/.test(userAgent)
    // Ensure Safari on iOS (not Chrome/Edge)
    const isSafari = isIOSDevice && /safari/.test(userAgent) && !/crios|fxios/.test(userAgent)

    if (isIOSDevice && !isWebview && isSafari) {
      setIsIOS(true)
      setIsVisible(true)
    }

    // Android logic
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem('houseplug_pwa_dismissed', Date.now().toString())
    setIsVisible(false)
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsVisible(false)
    }
    setDeferredPrompt(null)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-5">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 max-w-md mx-auto">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
              Install HousePlug <span className="flex h-2 w-2 rounded-full bg-[#F59E0B]"></span>
            </h3>
            {isIOS ? (
              <p className="text-sm text-gray-600 leading-relaxed">
                Tap the <Share className="inline h-4 w-4 mx-1" /> icon below, then choose <strong>Add to Home Screen</strong> <PlusSquare className="inline h-4 w-4 mx-1" /> for a better experience.
              </p>
            ) : (
              <p className="text-sm text-gray-600 leading-relaxed">
                Add HousePlug to your home screen for faster access and offline support.
              </p>
            )}
          </div>
          <button onClick={dismiss} className="shrink-0 p-2 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full">
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {!isIOS && (
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleInstall}
              className="flex-1 flex items-center justify-center gap-2 bg-[#1B4332] text-white py-2.5 rounded-xl font-bold text-sm hover:bg-[#1B4332]/90 transition"
            >
              <Download className="h-4 w-4" /> Install App
            </button>
            <button
              onClick={dismiss}
              className="flex-1 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700"
            >
              Not Now
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
