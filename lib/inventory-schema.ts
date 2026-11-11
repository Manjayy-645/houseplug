import { z } from "zod";
export const feeItemSchema = z.object({
  type: z.enum([
    "agency",
    "caution",
    "legal",
    "service",
    "other",
    "inspection",
  ]),
  label: z.string().trim().min(1).max(80),
  amount: z.number().int().nonnegative().max(100000000).nullable(),
  mandatory: z.boolean(),
  refundable: z.boolean(),
  recipient: z.string().trim().max(120).optional(),
});
export const inventoryReviewSchema = z.object({
  fee_items: z.array(feeItemSchema).max(20),
  fees_complete: z.boolean(),
  fee_source: z.string().trim().min(3).max(500),
  renewal_amount: z.number().int().nonnegative().max(100000000).nullable(),
  price_basis: z.enum(["unconfirmed", "per_bed", "per_room", "per_unit"]),
  rent_term_months: z.number().int().min(1).max(60).nullable(),
  sharing_allowed: z.boolean(),
  occupancy: z.number().int().min(1).max(4),
  confirm_availability: z.boolean(),
  confirm_media: z.boolean(),
  availability_days: z.number().int().min(1).max(30).default(14),
  evidence_days: z.number().int().min(1).max(365).default(90),
  authority_checked: z.boolean(),
  physically_inspected: z.boolean(),
  evidence_pointer: z.string().trim().min(3).max(500),
});
