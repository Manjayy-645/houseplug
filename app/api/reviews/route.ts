import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { sendNewReviewEmail } from "@/lib/email"

const reviewSchema = z.object({
  listingId: z.string().uuid("Invalid listing ID"),
  rating: z.coerce.number().int().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
  reviewText: z.string().max(1000, "Review is too long").optional().nullable(),
  reviewerName: z.string().max(80, "Name is too long").optional().nullable(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = reviewSchema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Invalid review data"
      return NextResponse.json({ error: firstError }, { status: 400 })
    }

    const { listingId, rating, reviewText, reviewerName } = parsed.data

    const supabase = createClient()

    // Insert the review
    const { data: review, error: insertError } = await supabase
      .from("reviews")
      .insert({
        listing_id: listingId,
        rating,
        review_text: reviewText?.trim() || null,
        reviewer_name: reviewerName?.trim() || "UniPort Student",
      })
      .select()
      .single()

    if (insertError) {
      console.error("[api/reviews] Insert error:", insertError)
      return NextResponse.json({ error: "Failed to submit review" }, { status: 500 })
    }

    // Try to send email to the landlord
    try {
      const { data: listing } = await supabase
        .from("listings")
        .select("landlord_id")
        .eq("id", listingId)
        .single()

      if (listing?.landlord_id) {
        // use service role client if we want to bypass RLS, but profiles is readable
        const { data: landlord } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", listing.landlord_id)
          .single()

        if (landlord?.email) {
          await sendNewReviewEmail({
            landlordEmail: landlord.email,
            rating,
            reviewerName: reviewerName?.trim() || "UniPort Student",
            reviewText: reviewText?.trim() || undefined,
            listingId,
          })
        }
      }
    } catch (emailError) {
      // Don't fail the review submission if email fails
      console.error("[api/reviews] Failed to send email:", emailError)
    }

    return NextResponse.json({ success: true, review })
  } catch (err: any) {
    console.error("[api/reviews] Unexpected error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
