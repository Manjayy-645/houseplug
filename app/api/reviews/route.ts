import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendNewReviewEmail } from "@/lib/email"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { listingId, rating, reviewText, reviewerName } = body

    if (!listingId || !rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createClient()

    // Insert the review
    const { data: review, error: insertError } = await supabase
      .from("reviews")
      .insert({
        listing_id: listingId,
        rating,
        review_text: reviewText || null,
        reviewer_name: reviewerName || "UniPort Student",
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
            reviewerName: reviewerName || "UniPort Student",
            reviewText,
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
