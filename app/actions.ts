"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function submitReview(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "You must be logged in to leave a review." }

  const listingId = formData.get("listingId") as string
  const rating = Number(formData.get("rating"))
  const comment = formData.get("comment") as string

  if (!listingId || isNaN(rating) || !comment) {
    return { error: "Missing required fields." }
  }

  if (comment.length < 20) {
    return { error: "Review is too short. Please provide more detail (min 20 chars)." }
  }

  if (comment.length > 500) {
    return { error: "Review is too long (max 500 chars)." }
  }

  const { error } = await supabase.from("reviews").insert({
    listing_id: listingId,
    student_id: user.id,
    rating,
    comment
  })

  if (error) {
    if (error.code === "23505") {
      return { error: "You have already reviewed this listing." }
    }
    return { error: error.message }
  }

  revalidatePath(`/listing/${listingId}`)
  return { success: true }
}

export async function replyToReview(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: "You must be logged in to reply." }

  const reviewId = formData.get("reviewId") as string
  const reply = formData.get("reply") as string

  if (!reviewId || !reply) {
    return { error: "Missing required fields." }
  }

  // Verify that the user is the landlord of the listing this review belongs to
  const { data: review } = await supabase
    .from("reviews")
    .select("listing_id, listings!inner(landlord_id)")
    .eq("id", reviewId)
    .single()

  if (!review || (review.listings as any).landlord_id !== user.id) {
    return { error: "You are not authorized to reply to this review." }
  }

  const { error } = await supabase
    .from("reviews")
    .update({ reply })
    .eq("id", reviewId)

  if (error) return { error: error.message }

  revalidatePath("/landlord/reviews")
  return { success: true }
}

export async function recordWhatsAppClick(listingId: string) {
  const supabase = createClient()
  await supabase.rpc("increment_whatsapp_clicks", { listing_id: listingId })
}

export async function recordPhoneReveal(listingId: string) {
  const supabase = createClient()
  await supabase.rpc("increment_phone_reveals", { listing_id: listingId })
}

export async function recordListingView(listingId: string) {
  const supabase = createClient()
  await supabase.rpc("increment_views", { listing_id: listingId })
}
