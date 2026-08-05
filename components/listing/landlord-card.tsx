import Link from "next/link"
import { Star, Check } from "lucide-react"
import type { Profile } from "@/types"
import { getInitials } from "@/lib/utils"

type LandlordCardProps = {
  landlord: Profile
  rating: number
  reviewCount: number
}

export default function LandlordCard({ landlord, rating, reviewCount }: LandlordCardProps) {
  const memberSinceYear = landlord.created_at ? new Date(landlord.created_at).getFullYear() : new Date().getFullYear()
  const profileLink = landlord.username
    ? `/landlord/${landlord.username}`
    : `/browse?landlord_id=${landlord.id}`

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        {landlord.avatar_url ? (
          <img
            src={landlord.avatar_url}
            alt={landlord.full_name}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1B4332] text-sm font-semibold text-white">
            {getInitials(landlord.full_name)}
          </div>
        )}

        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900">{landlord.full_name}</h3>
          <p className="text-sm text-gray-600">Member since {memberSinceYear}</p>

          <div className="mt-2 flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 text-[#F59E0B]">
              <Star className="h-4 w-4 fill-[#F59E0B]" />
              <span className="font-semibold text-gray-800">{reviewCount ? rating.toFixed(1) : "New"}</span>
            </div>
            <span className="text-gray-500">({reviewCount} reviews)</span>
          </div>
        </div>
      </div>

      <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
        <Check className="h-4 w-4" />
        ID Verified
      </div>

      <p className="text-sm text-gray-600">Replies within a few hours</p>

      <Link
        href={profileLink}
        className="block w-full rounded-xl border border-[#1B4332] bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#1B4332] hover:bg-[#1B4332]/5"
      >
        View all listings by this landlord
      </Link>
    </section>
  )
}

