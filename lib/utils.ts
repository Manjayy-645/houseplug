import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { SITE_URL } from "@/lib/site";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export function formatDistance(
  distance: string,
  universityShortName: string = "campus",
): string {
  const map: Record<string, string> = {
    under_5: `Under 5 mins from ${universityShortName} gate`,
    "5_to_15": `5–15 mins from ${universityShortName} gate`,
    "15_to_30": `15–30 mins from ${universityShortName} gate`,
    above_30: `30+ mins from ${universityShortName} gate`,
  };
  return `Advertiser estimate: ${map[distance] ?? "distance not confirmed"}`;
}

export function formatRoomType(type: string): string {
  const map: Record<string, string> = {
    self_con: "Self-con",
    one_bedroom: "1 Bedroom",
    two_bedroom: "2 Bedroom",
    shared: "Shared Room",
  };
  return map[type] ?? type;
}

export function buildWhatsAppLink(
  phone: string,
  listingTitle: string,
  listingId?: string,
): string {
  const digits = (phone || "").replace(/\D/g, "");
  const normalized = digits.startsWith("0")
    ? "234" + digits.slice(1)
    : digits.startsWith("234")
      ? digits
      : digits
        ? "234" + digits
        : "";
  // A missing advertiser contact must never masquerade as a WhatsApp link.
  if (!/^234[789][01]\d{8}$/.test(normalized)) return "";
  const urlSuffix = listingId
    ? `\nListing reference: ${listingId}\n${SITE_URL}/listing/${encodeURIComponent(listingId)}`
    : "";
  const message = encodeURIComponent(
    `Hi, I found your listing on HousePlug - ${listingTitle}. Is it still available?${urlSuffix}`,
  );
  return `https://wa.me/${normalized}?text=${message}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
