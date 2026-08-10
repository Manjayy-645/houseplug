"use client"

import { useEffect, useState } from "react"
import { Activity } from "lucide-react"
import { UNIVERSITIES } from "@/lib/constants"

type ActivityEvent = {
  event_type: 'new_listing' | 'whatsapp_click' | 'new_review' | 'verified_landlord'
  area: string | null
  university: string | null
}

const getEventText = (event: ActivityEvent) => {
  const { event_type, area, university: universityId } = event
  
  const universityObj = UNIVERSITIES.find(u => u.id === universityId)
  const university = universityObj?.shortName || universityId

  switch (event_type) {
    case "whatsapp_click":
      return area ? `Someone just contacted a landlord in ${area}` : "Someone just contacted a landlord"
    case "new_listing":
      return university ? `New listing added near ${university}` : (area ? `New listing added near ${area}` : "New listing added")
    case "new_review":
      return area ? `A student just left a review in ${area}` : "A student just left a review"
    case "verified_landlord":
      return area ? `A landlord in ${area} just got verified` : "A landlord just got verified"
    default:
      return ""
  }
}

export function ActivityTicker() {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/activity/recent")
      .then(res => res.json())
      .then(data => {
        if (data.events) {
          setEvents(data.events)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (events.length >= 3) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % events.length)
      }, 4000)
      return () => clearInterval(interval)
    }
  }, [events])

  if (loading) return null

  const showSparse = events.length < 3
  const currentText = showSparse 
    ? "Join students already using HousePlug." 
    : getEventText(events[currentIndex])

  return (
    <div className="flex justify-center px-4 w-full my-6">
      <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-full shadow-sm border border-gray-100 max-w-lg w-full">
        <div className="relative flex items-center justify-center">
          <Activity className="h-4 w-4 text-[#F59E0B]" />
          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F59E0B] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F59E0B]"></span>
          </span>
        </div>
        <div className="overflow-hidden flex-1 relative h-5">
          <div
            key={currentIndex}
            className="animate-in fade-in slide-in-from-bottom-2 absolute inset-0 text-sm font-medium text-gray-700 truncate"
          >
            {currentText}
          </div>
        </div>
      </div>
    </div>
  )
}
