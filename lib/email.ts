import { Resend } from "resend"
import { createClient as createAdminClient } from "@supabase/supabase-js"

// Server-only address used as the email sender. Override with EMAIL_FROM if the
// verified Resend domain differs. The recipient list is always fetched from the
// DB — never hardcoded.
const EMAIL_FROM = process.env.EMAIL_FROM || "HousePlug <noreply@houseplug.ng>"

/**
 * Email every admin / super_admin with a branded notification and a single
 * call-to-action link into the admin panel.
 *
 * This is best-effort: it never throws. A missing API key, missing admins, or a
 * Resend failure is logged and swallowed so the calling flow (listing creation,
 * verification submission) is never blocked.
 */
export async function sendAdminNotification(
  subject: string,
  message: string,
  actionUrl: string,
  actionLabel: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — skipping admin notification")
    return
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    console.warn("[email] Supabase service credentials missing — skipping admin notification")
    return
  }

  try {
    const supabase = createAdminClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: admins } = await supabase
      .from("profiles")
      .select("email")
      .in("role", ["admin", "super_admin"])

    const adminEmails = (admins ?? [])
      .map((a) => a.email)
      .filter((email): email is string => Boolean(email))

    if (adminEmails.length === 0) {
      console.log("[email] No admin emails found — nothing to send")
      return
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1B4332;">HousePlug Admin Alert</h2>
        <p style="color: #555; line-height: 1.6;">${message}</p>
        <a href="${actionUrl}"
           style="display: inline-block; background-color: #1B4332; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px;">
          ${actionLabel}
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          This is an automated notification from HousePlug.
        </p>
      </div>
    `

    const resend = new Resend(apiKey)
    await resend.emails.send({
      from: EMAIL_FROM,
      to: adminEmails,
      subject,
      html: htmlContent,
    })
    console.log(`[email] Admin notification sent to ${adminEmails.length} admin(s)`)
  } catch (error) {
    console.error("[email] Failed to send admin notification:", error)
  }
}
