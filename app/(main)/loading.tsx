import { Loader2 } from "lucide-react"

export default function MainLoading() {
  return (
    <div className="flex h-[60vh] w-full flex-col items-center justify-center space-y-4">
      <Loader2 className="h-10 w-10 animate-spin text-[#1B4332]" />
      <p className="text-sm font-medium text-gray-500">Loading...</p>
    </div>
  )
}
