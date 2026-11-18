import { z } from "zod";
import {
  CAMPUS_ZONES,
  HOUSING_PROPERTY_TYPES,
  MOVE_IN_TIMELINES,
  PARTNER_AGENTS_WHATSAPP_GROUP_URL,
} from "@/lib/constants";
import type { CampusZone, HousingPropertyType, MoveInTimeline } from "@/types";

export const studentHousingRequestSchema = z
  .object({
    student_name: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(80, "Name must be under 80 characters"),
    student_whatsapp: z
      .string()
      .trim()
      .regex(
        /^(?:0[789][01]\d{8}|234[789][01]\d{8})$/,
        "Please enter a valid Nigerian WhatsApp number (e.g. 08012345678)"
      ),
    campus_zone: z.enum(CAMPUS_ZONES, {
      message: "Please select your preferred campus zone",
    }),
    property_type: z.enum(HOUSING_PROPERTY_TYPES, {
      message: "Please select the lodge / property type",
    }),
    min_budget: z.coerce
      .number({ message: "Enter a valid minimum budget in Naira" })
      .int("Budget must be a whole number")
      .min(20_000, "Minimum budget must be at least ₦20,000")
      .max(50_000_000, "Budget cannot exceed ₦50,000,000"),
    max_budget: z.coerce
      .number({ message: "Enter a valid maximum budget in Naira" })
      .int("Budget must be a whole number")
      .min(20_000, "Maximum budget must be at least ₦20,000")
      .max(50_000_000, "Budget cannot exceed ₦50,000,000"),
    move_in_timeline: z.enum(MOVE_IN_TIMELINES, {
      message: "Please select your move-in timeline",
    }),
    extra_notes: z
      .string()
      .trim()
      .max(500, "Extra requirements must be under 500 characters")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.max_budget >= data.min_budget, {
    message: "Maximum budget must be greater than or equal to minimum budget",
    path: ["max_budget"],
  });

export type StudentHousingRequestInput = z.infer<typeof studentHousingRequestSchema>;

/**
 * Normalizes any valid Nigerian phone number into international wa.me format (234XXXXXXXXXX).
 */
export function cleanWhatsAppNumber(phone?: string | null): string {
  if (!phone) return "2348000000000";
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return "234" + digits.slice(1);
  }
  if (digits.startsWith("234")) {
    return digits;
  }
  return digits;
}

/**
 * Returns the configured Admin WhatsApp number or fallback.
 */
export function getAdminWhatsAppNumber(): string {
  const envAdmin = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP;
  return cleanWhatsAppNumber(envAdmin || "2348000000000");
}

/**
 * Generates an alphanumeric request code (e.g. 'HP-8F2B').
 */
export function generateRequestCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `HP-${suffix}`;
}

export type BroadcastMessageParams = {
  request_code: string;
  campus_zone: string;
  property_type: string;
  min_budget: number;
  max_budget: number;
  move_in_timeline: string;
  extra_notes?: string | null;
  adminWhatsapp?: string;
};

/**
 * Formats the exact 1-Click WhatsApp Broadcast message to drop into Partner Agents WhatsApp groups.
 */
export function formatPartnerAgentBroadcastMessage({
  request_code,
  campus_zone,
  property_type,
  min_budget,
  max_budget,
  move_in_timeline,
  extra_notes,
  adminWhatsapp,
}: BroadcastMessageParams): string {
  const adminWa = cleanWhatsAppNumber(adminWhatsapp || getAdminWhatsAppNumber());
  const claimText = `Hello HousePlug Admin! I have a matching vacant ${property_type} in ${campus_zone} for Request #${request_code}.`;
  const claimDeepLink = `https://wa.me/${adminWa}?text=${encodeURIComponent(claimText)}`;
  const notes = extra_notes?.trim() ? extra_notes.trim() : "Neat, secure compound with water";

  return `🚨 *NEW STUDENT HOUSING REQUEST (#${request_code})* 🚨

📍 *Preferred Area:* ${campus_zone}
🏠 *Property Type:* ${property_type}
💰 *Student's Budget:* ₦${min_budget.toLocaleString("en-NG")} – ₦${max_budget.toLocaleString("en-NG")} / year
📅 *Move-In Timeline:* ${move_in_timeline}
📝 *Extra Notes:* ${notes}

*Got a matching vacant lodge?*
👉 *Click here to claim this lead & send photos:*
${claimDeepLink}

🌐 *Or list your property free at:* https://www.houseplug.ng`;
}

/**
 * Formats the claim WhatsApp URL for landlords and partner agents.
 */
export function getAgentClaimWhatsAppUrl(
  requestCode: string,
  campusZone: string,
  propertyType: string,
  adminWhatsapp?: string
): string {
  const adminWa = cleanWhatsAppNumber(adminWhatsapp || getAdminWhatsAppNumber());
  const claimText = `Hello HousePlug Admin! I have a matching vacant ${propertyType} in ${campusZone} for Request #${requestCode}.`;
  return `https://wa.me/${adminWa}?text=${encodeURIComponent(claimText)}`;
}

/**
 * Generates the WhatsApp share URL for direct browser broadcast opening.
 */
export function getWhatsAppSendUrl(message: string): string {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}

/**
 * Returns the official WhatsApp invite link for the Partner Agents & Landlords group/channel.
 */
export function getPartnerAgentsGroupUrl(): string {
  return (
    process.env.NEXT_PUBLIC_PARTNER_AGENTS_GROUP_URL ||
    PARTNER_AGENTS_WHATSAPP_GROUP_URL
  );
}

