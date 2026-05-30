"use client"

import { Download } from "lucide-react"

export function ClientDownloadButton({ username }: { username: string }) {
  const handleDownload = async () => {
    const element = document.getElementById('houseplug-card')
    if (!element) return
    
    const html2canvas = (await import('html2canvas')).default
    
    const canvas = await html2canvas(element, {
      scale: 3,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true,
      logging: false,
    })
    
    const link = document.createElement('a')
    link.download = `houseplug-${username}-card.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <button
      onClick={handleDownload}
      className="flex items-center justify-center gap-2 w-full bg-[#F59E0B] text-white rounded-xl py-3 text-sm font-bold shadow-sm hover:brightness-110 transition active:scale-95"
    >
      <Download className="h-4 w-4" /> Download Card
    </button>
  )
}
