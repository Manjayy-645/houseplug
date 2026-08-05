"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createRoommateProfile(data: {
  intent: "have_room" | "teaming_up"
  university: string
  budget_min: number
  budget_max: number
  gender: string
  preferred_gender: string
  lifestyle_tags: string[]
  bio: string
  phone_number: string
  room_photos?: string[]
  room_address?: string
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be logged in to create a roommate profile." }
  }

  // Check if they are a student
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "student") {
    return { error: "Only students can create roommate profiles." }
  }

  // Insert or update profile
  const { error } = await supabase
    .from("roommate_profiles")
    .upsert({
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
      room_photos: data.room_photos || [],
      room_address: data.room_address || null,
      status: "active"
    }, { onConflict: "user_id" })

  if (error) {
    console.error("Failed to create roommate profile:", error)
    return { error: error.message }
  }

  revalidatePath("/roommates")
  return { success: true }
}
