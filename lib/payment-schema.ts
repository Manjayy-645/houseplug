import { z } from "zod";
export const paymentInput = z
  .object({
    type: z.enum([
      "subscription",
      "boost",
      "verification",
      "service_listing",
      "service_boost",
    ]),
    plan: z.enum(["pro", "business"]).optional(),
    billing_cycle: z.enum(["monthly", "annual"]).optional(),
    listing_id: z.string().uuid().optional(),
    service_id: z.string().uuid().optional(),
    boost_type: z
      .enum(["featured_7", "featured_30", "urgent", "refresh"])
      .optional(),
    return_url: z.string().max(200).optional(),
    verification: z.record(z.string(), z.unknown()).optional(),
  })
  .superRefine((v, c) => {
    if (v.type === "subscription" && (!v.plan || !v.billing_cycle))
      c.addIssue({ code: "custom", message: "Choose plan and billing cycle" });
    if (v.type === "boost" && (!v.listing_id || !v.boost_type))
      c.addIssue({ code: "custom", message: "Choose your listing and boost" });
    if (v.type.startsWith("service_") && !v.service_id)
      c.addIssue({ code: "custom", message: "Choose your service" });
    if (v.type === "service_boost" && !v.boost_type)
      c.addIssue({ code: "custom", message: "Choose boost" });
  });
export function assertPaymentMatches(
  transaction: {
    amount: number;
    currency: string;
    metadata?: Record<string, unknown>;
  },
  order: {
    amount: number;
    landlord_id: string;
    type: string;
    listing_id?: string | null;
    service_id?: string | null;
    plan?: string | null;
    billing_cycle?: string | null;
    boost_type?: string | null;
  },
) {
  if (
    transaction.currency !== "NGN" ||
    transaction.amount !== order.amount ||
    !Number.isSafeInteger(transaction.amount) ||
    transaction.amount <= 0
  )
    throw Error("Payment amount or currency mismatch");
  const m = transaction.metadata ?? {};
  for (const key of [
    "landlord_id",
    "type",
    "listing_id",
    "service_id",
    "plan",
    "billing_cycle",
    "boost_type",
  ] as const) {
    if ((m[key] ?? null) !== (order[key] ?? null))
      throw Error("Payment order mismatch");
  }
}
