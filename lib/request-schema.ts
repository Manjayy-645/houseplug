import { z } from "zod";
import { UNIVERSITIES, ROOM_TYPES } from "@/lib/constants";
export const housingRequestSchema = z.object({
  submission_key: z.string().uuid(),
  listing_id: z.string().uuid().optional(),
  university: z
    .string()
    .refine(
      (v) => UNIVERSITIES.some((u) => u.id === v),
      "Choose a supported campus",
    ),
  area: z.string().trim().min(2).max(120),
  total_budget: z.coerce.number().int().positive().max(100_000_000),
  move_in_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine(
      (v) =>
        !isNaN(Date.parse(v)) &&
        new Date(v).toISOString().slice(0, 10) === v &&
        v >= new Date().toISOString().slice(0, 10),
      "Choose today or a future date",
    ),
  room_type: z
    .string()
    .refine((v) => ROOM_TYPES.some((t) => t.value === v))
    .optional(),
  contact_name: z.string().trim().min(2).max(80),
  contact_phone: z
    .string()
    .regex(
      /^(?:0[789][01]\d{8}|234[789][01]\d{8})$/,
      "Enter a Nigerian mobile number",
    ),
  contact_email: z
    .union([z.string().email().max(254), z.literal("")])
    .optional(),
  contact_consent: z.literal(true),
  marketing_consent: z.boolean().default(false),
  reminder_consent: z.boolean().default(false),
  source: z.string().max(80).optional(),
  medium: z.string().max(80).optional(),
  campaign: z.string().max(80).optional(),
  content_code: z.string().max(80).optional(),
  referral_code: z.string().max(40).optional(),
  website: z.string().max(0).optional(),
});
export function attributionToken(value?: string) {
  return value && /^[a-z][a-z0-9_-]{0,79}$/.test(value) && !/\d{7}/.test(value)
    ? value
    : null;
}
export const leadTransitions: Record<string, string[]> = {
  new: ["qualified", "spam", "cancelled"],
  qualified: ["matching", "connected", "closed_unmatched", "cancelled"],
  matching: ["connected", "closed_unmatched", "cancelled"],
  connected: ["rented", "closed_unmatched", "cancelled"],
  closed_unmatched: [],
  cancelled: [],
  rented: [],
  spam: [],
};
