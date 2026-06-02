"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendAdminNotification } from "@/lib/email"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://houseplug.ng"

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

/**
 * Notify admins that a landlord submitted a new listing pending approval.
 * Called by the listing form after a successful insert. Verifies the caller
 * owns the listing and that it is genuinely pending before emailing. Best
 * effort — never throws back into the creation flow.
 */
export async function notifyAdminsNewListing(listingId: string) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: listing } = await supabase
      .from("listings")
      .select("title, area, status, landlord_id")
      .eq("id", listingId)
      .single()

    // Only notify for the owner's own genuinely-pending listing.
    if (!listing || listing.landlord_id !== user.id || listing.status !== "pending") {
      return
    }

    const { data: landlord } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", listing.landlord_id)
      .single()

    const name = landlord?.full_name || "A landlord"

    await sendAdminNotification(
      "New Listing Pending Approval",
      `${name} submitted a listing: "${listing.title}" in ${listing.area}. Review and approve or reject.`,
      `${APP_URL}/admin/listings`,
      "Review Listing"
    )
  } catch (error) {
    console.error("[actions] notifyAdminsNewListing failed:", error)
  }
}

/**
 * Notify admins that a landlord submitted verification documents.
 * Called by the verification form after a successful submission. Uses the
 * authenticated session to resolve the submitter. Best effort — never throws.
 */
export async function notifyAdminsVerificationSubmitted() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single()

    const name = profile?.full_name || "A landlord"

    await sendAdminNotification(
      "New Verification Submission",
      `${name} submitted documents for verification. Review their ID and property docs.`,
      `${APP_URL}/admin/verification`,
      "Review Verification"
    )
  } catch (error) {
    console.error("[actions] notifyAdminsVerificationSubmitted failed:", error)
  }
}
