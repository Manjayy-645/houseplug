import Image from "next/image"
import { UNIVERSITIES, type Campus } from "@/lib/constants"

export type UniversityLogoProps = {
  university?:
    | Campus
    | {
        id?: string
        name?: string
        shortName?: string
        initials?: string
        bgColor?: string
        logoUrl?: string
      }
    | string
    | null
  size?: number
  className?: string
  priority?: boolean
}

/**
 * Renders a university crest when a logoUrl is set, otherwise the coloured
 * initials badge. Shared across the homepage, browse filters, listing cards,
 * campus hub, search dropdowns, and roommate cards.
 *
 * Can receive a university object OR a university ID/string (e.g. "uniport", "UNILAG").
 */
export function UniversityLogo({
  university,
  size = 24,
  className = "",
  priority = false,
}: UniversityLogoProps) {
  if (!university) return null

  // If a string (like "uniport" or "University of Lagos") was passed, resolve from constants
  const resolved:
    | {
        name?: string
        shortName?: string
        initials?: string
        bgColor?: string
        logoUrl?: string
      }
    | undefined =
    typeof university === "string"
      ? UNIVERSITIES.find(
          (u) =>
            u.id.toLowerCase() === university.toLowerCase() ||
            u.shortName.toLowerCase() === university.toLowerCase() ||
            u.name.toLowerCase() === university.toLowerCase()
        ) || {
          name: university,
          shortName: university,
          initials: university.slice(0, 2).toUpperCase(),
          bgColor: "bg-gray-500",
        }
      : university

  if (!resolved) return null

  if (!resolved.logoUrl) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white shadow-inner ${
          resolved.bgColor ?? "bg-gray-500"
        } ${className}`}
        style={{
          width: size,
          height: size,
          fontSize: Math.max(8, Math.round(size * 0.32)),
        }}
        title={resolved.name || resolved.shortName}
      >
        {resolved.initials ??
          resolved.shortName?.slice(0, 2).toUpperCase() ??
          "HP"}
      </div>
    )
  }

  return (
    <div
      className={`relative shrink-0 overflow-hidden ${className}`}
      style={{ width: size, height: size }}
      title={resolved.name || resolved.shortName}
    >
      <Image
        src={resolved.logoUrl}
        alt={resolved.name ?? resolved.shortName ?? "University"}
        fill
        sizes={`${size}px`}
        priority={priority}
        className="object-contain"
      />
    </div>
  )
}
