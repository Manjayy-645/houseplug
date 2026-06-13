import Image from "next/image"

type University = {
  name?: string
  shortName?: string
  initials?: string
  bgColor?: string
  logoUrl?: string
}

/**
 * Renders a university crest when a logoUrl is set, otherwise the coloured
 * initials badge. Shared across the homepage, browse filters, and listing cards.
 */
export function UniversityLogo({
  university,
  size = 24,
  className = "",
}: {
  university?: University | null
  size?: number
  className?: string
}) {
  if (!university) return null

  if (!university.logoUrl) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-inner ${university.bgColor ?? "bg-gray-500"} ${className}`}
        style={{ width: size, height: size, fontSize: Math.max(8, Math.round(size * 0.32)) }}
      >
        {university.initials}
      </div>
    )
  }

  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      <Image
        src={university.logoUrl}
        alt={university.name ?? "University"}
        fill
        sizes={`${size}px`}
        className="object-contain"
      />
    </div>
  )
}
