"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function submitAppeal(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  const appeal_message = formData.get("appeal_message") as string
  const ban_id = formData.get("ban_id") as string

  if (!appeal_message || !ban_id) return

  const { error } = await supabase.from("appeals").insert({
    user_id: user.id,
    ban_id,
    appeal_message
  })

  if (!error) {
    // Send confirmation email
    try {
      const { Resend } = require('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: "HousePlug <noreply@send.houseplug.ng>",
        to: user.email!,
        subject: "We've received your HousePlug appeal",
        html: `<p>We have received your appeal and our team will review it shortly. We will update you via email once a decision has been made.</p>`
      })
    } catch (e) {
      console.error("Failed to send appeal confirmation email", e)
    }
  }

  revalidatePath("/appeal")
}
