import { z } from "zod";
import { UNIVERSITIES } from "@/lib/constants";

export const HOUSING_SERVICE_CATEGORIES = [
  { id: "moving", label: "Moving and transport" },
  { id: "cleaning", label: "Cleaning and fumigation" },
  { id: "repairs", label: "Repairs and maintenance" },
  { id: "painting", label: "Painting and decor" },
  { id: "laundry", label: "Laundry" },
  { id: "gas_refill", label: "Gas refill and delivery" },
] as const;

export const serviceSubmissionSchema = z.object({
  id: z.string().uuid().optional(),
  business_name: z.string().trim().min(2).max(100),
  category: z.enum(["moving", "cleaning", "repairs", "painting", "laundry", "gas_refill"]),
  university: z.string().refine((id) => UNIVERSITIES.some((u) => u.id === id), "Select a supported campus"),
  description: z.string().trim().min(30).max(1500),
  pricing_type: z.enum(["fixed", "starting_from"]),
  price_amount: z.number().int().min(1).max(100000000),
  price_unit: z.string().trim().min(2).max(40),
  whatsapp_number: z.string().trim().transform((phone) => phone.replace(/[\s()-]/g, "").replace(/^\+234/, "0").replace(/^234/, "0")).pipe(z.string().regex(/^0(?:70|80|81|90|91)\d{8}$/, "Enter a Nigerian mobile WhatsApp number")),
});
