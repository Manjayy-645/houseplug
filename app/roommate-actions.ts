"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// ── Shared validation schema ──────────────────────────────────────────────────
// Nigerian mobile: 070/080/081/090/091 + 8 digits
const NIGERIAN_PHONE_RE = /^(0)(7|8|9)(0|1)\d{8}$/

const createRoommateSchema = z
  .object({
    intent: z.enum(["have_room", "teaming_up"]),
    university: z.string().min(1).max(100),
    budget_min: z.number().int().min(10_000).max(100_000_000),
    budget_max: z.number().int().min(10_000).max(100_000_000),
    gender: z.enum(["Male", "Female"]),
    preferred_gender: z.enum(["Male Only", "Female Only", "Any"]),
    lifestyle_tags: z.array(z.string().min(1).max(50)).min(1).max(5),
    bio: z.string().min(20).max(300),
    phone_number: z
      .string()
      .regex(NIGERIAN_PHONE_RE, "Enter a valid Nigerian number (e.g. 08012345678)"),
    room_photos: z.array(z.string().url()).max(5).optional(),
    room_address: z.string().max(200).optional(),
  })
  .refine((d) => d.budget_max >= d.budget_min, {
    message: "Maximum budget must be ≥ minimum budget",
    path: ["budget_max"],
  })

// ── Helper: verify the calling user is an authenticated student ───────────────
async function requireStudent(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, error: "You must be logged in." }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "student") {
    return { user: null, error: "Only students can use the roommate feature." }
  }

  return { user, error: null }
}

// ── Actions ───────────────────────────────────────────────────────────────────

export async function createRoommateProfile(raw: unknown) {
  const supabase = createClient()

  // 1. Auth + role guard
  const { user, error: authError } = await requireStudent(supabase)
  if (authError || !user) return { error: authError }

  // 2. Server-side Zod validation (never trust client-supplied data)
  const parsed = createRoommateSchema.safeParse(raw)
  if (!parsed.success) {
    const firstMessage = parsed.error.issues[0]?.message ?? "Invalid input."
    return { error: firstMessage }
  }

  const data = parsed.data

  // 3. Persist (user_id always comes from the verified session, not input)
  const { error } = await supabase.from("roommate_profiles").upsert(
    {
      user_id: user.id,
      intent: data.intent,
      university: data.university,
      budget_min: data.budget_min,
      budget_max: data.budget_max,
      gender: data.gender,
      preferred_gender: data.preferred_gender,
      lifestyle_tags: data.lifestyle_tags,
      bio: data.bio,
      phone_number: data.phone_number,
      room_photos: data.room_photos ?? [],
      room_address: data.room_address ?? null,
      status: "active",
    },
    { onConflict: "user_id" }
  )

  if (error) {
    console.error("Failed to create roommate profile:", error)
    // Don't leak Supabase internals to the client
    return { error: "Failed to save profile. Please try again." }
  }

  revalidatePath("/roommates")
  revalidatePath("/student/roommate")
  revalidatePath("/student/dashboard")
  return { success: true }
}

export async function updateRoommateStatus(status: "active" | "paused" | "found") {
  const supabase = createClient()

  // 1. Auth + role guard (defence-in-depth — RLS also enforces row ownership)
  const { user, error: authError } = await requireStudent(supabase)
  if (authError || !user) return { error: authError }

  // 2. Explicit server-side enum validation (never trust the client)
  const allowedStatuses = ["active", "paused", "found"] as const
  if (!(allowedStatuses as readonly string[]).includes(status)) {
    return { error: "Invalid status value." }
  }

  // 3. Update only the caller's own row (RLS will also enforce this)
  const { data, error } = await supabase
    .from("roommate_profiles")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    console.error("Failed to update roommate status:", error)
    return { error: "Failed to update status. Please try again." }
  }

  revalidatePath("/roommates")
  revalidatePath("/student/roommate")
  revalidatePath("/student/dashboard")
  return { success: true, data }
}

