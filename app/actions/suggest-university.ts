"use server"

import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const suggestUniversitySchema = z.object({
  universityName: z.string().min(2).max(120).trim(),
  campusArea: z.string().max(100).trim().optional().or(z.literal("")),
  role: z.enum(["student", "landlord"]),
  contactInfo: z.string().min(5).max(100).trim(),
})

export async function suggestUniversity(data: {
  universityName: string
  campusArea?: string
  role: "student" | "landlord"
  contactInfo: string
}) {
  try {
    const validated = suggestUniversitySchema.parse(data)
    const supabase = createClient()

    // Get current user if available (non-blocking if anonymous)
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from("university_requests").insert({
      university_name: validated.universityName,
      campus_area: validated.campusArea || null,
      role: validated.role,
      contact_info: validated.contactInfo,
      user_id: user?.id || null,
    })

    if (error) {
      console.error("[SERVER ACTION] suggestUniversity insert error:", error)
      return { success: false, error: "Failed to submit request. Please try again." }
    }

    return { success: true }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { success: false, error: "Invalid input data. Please check your fields." }
    }
    console.error("[SERVER ACTION] suggestUniversity unexpected error:", err)
    return { success: false, error: "An unexpected error occurred." }
  }
}
