import { Resend } from "resend"
import { createClient as createAdminClient } from "@supabase/supabase-js"

const EMAIL_FROM = process.env.EMAIL_FROM || "HousePlug <noreply@send.houseplug.ng>"

function getEmailHtml(message: string, actionUrl: string, actionLabel: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>HousePlug</title>
</head>
<body style="margin:0; padding:0; background-color:#F0F4F1; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F0F4F1;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%;">

          <!-- Header -->
          <tr>
            <td style="background-color:#1B4332; border-radius:12px 12px 0 0; padding:36px 48px; text-align:center;">
              <p style="margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; font-size:10px; color:#6EE7B7; letter-spacing:4px; text-transform:uppercase; font-weight:700;">Student Housing Platform</p>
              <h1 style="margin:8px 0 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; font-size:34px; font-weight:800; color:#ffffff; letter-spacing:-1px;">HousePlug</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff; padding:40px 48px 32px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; font-size:16px; color:#374151; line-height:1.75; border-left:1px solid #E5E7EB; border-right:1px solid #E5E7EB;">
              ${message}
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="background-color:#ffffff; padding:0 48px 44px; text-align:center; border-left:1px solid #E5E7EB; border-right:1px solid #E5E7EB;">
              <a href="${actionUrl}"
                 style="display:inline-block; background-color:#1B4332; color:#ffffff; padding:15px 40px; border-radius:8px; text-decoration:none; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; font-weight:700; font-size:15px; letter-spacing:0.3px;">
                ${actionLabel} &rarr;
              </a>
              <p style="margin:14px 0 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; font-size:12px; color:#9CA3AF;">
                Button not working? <a href="${actionUrl}" style="color:#1B4332; text-decoration:underline;">Click here</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F9FAFB; border-radius:0 0 12px 12px; padding:24px 48px; text-align:center; border:1px solid #E5E7EB; border-top:1px solid #E5E7EB;">
              <p style="margin:0 0 4px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; font-size:12px; color:#9CA3AF;">
                &copy; ${new Date().getFullYear()} HousePlug &bull; <a href="https://houseplug.ng" style="color:#6B7280; text-decoration:none;">houseplug.ng</a>
              </p>
              <p style="margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; font-size:11px; color:#D1D5DB;">
                This is an automated notification &mdash; please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

async function sendEmail({ to, subject, message, actionUrl, actionLabel }: {
  to: string | string[],
  subject: string,
  message: string,
  actionUrl: string,
  actionLabel: string
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — skipping email")
    return
  }

  try {
    const resend = new Resend(apiKey)
    await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html: getEmailHtml(message, actionUrl, actionLabel),
    })
  } catch (error) {
    console.error(`[email] Failed to send email to ${to}:`, error)
  }
}

export async function sendAdminNotification(
  subject: string,
  message: string,
  actionUrl: string,
  actionLabel: string
): Promise<void> {
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

    await sendEmail({ to: adminEmails, subject, message, actionUrl, actionLabel })
    console.log(`[email] Admin notification sent to ${adminEmails.length} admin(s)`)
  } catch (error) {
    console.error("[email] Failed to fetch admins for notification:", error)
  }
}

export async function sendListingStatusEmail({
  landlordEmail,
  listingTitle,
  status,
  listingId,
  rejectionReason
}: {
  landlordEmail: string,
  listingTitle: string,
  status: 'approved' | 'rejected',
  listingId: string,
  rejectionReason?: string
}): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://houseplug.ng'

  const subject = status === 'approved'
    ? `Your listing is live on HousePlug!`
    : `Action needed: "${listingTitle}"`

  const message = status === 'approved'
    ? `
      <div style="background-color:#ECFDF5; border-left:4px solid #10B981; padding:16px 20px; border-radius:0 8px 8px 0; margin:0 0 28px;">
        <p style="margin:0; font-size:17px; font-weight:700; color:#065F46; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">&#10003;&nbsp; Your listing is live!</p>
      </div>
      <p style="margin:0 0 16px;">Great news! Your listing <strong style="color:#111827;">&ldquo;${listingTitle}&rdquo;</strong> has been <strong style="color:#10B981;">approved</strong> and is now visible to thousands of students on HousePlug.</p>
      <p style="margin:0 0 16px;">Keep your WhatsApp notifications on &mdash; students can now contact you directly with one tap.</p>
      <p style="margin:0; font-size:14px; color:#6B7280;">Tip: Listings with recent responses rank higher in search results.</p>
    `
    : `
      <div style="background-color:#FFFBEB; border-left:4px solid #F59E0B; padding:16px 20px; border-radius:0 8px 8px 0; margin:0 0 28px;">
        <p style="margin:0; font-size:17px; font-weight:700; color:#92400E; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">&#9888;&nbsp; Changes needed</p>
      </div>
      <p style="margin:0 0 16px;">We reviewed your listing <strong style="color:#111827;">&ldquo;${listingTitle}&rdquo;</strong> and it needs a few updates before it can go live.</p>
      ${rejectionReason ? `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
        <tr>
          <td style="background-color:#FEF3C7; padding:16px 20px; border-radius:8px;">
            <p style="margin:0 0 6px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#92400E; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">Reason for rejection</p>
            <p style="margin:0; color:#78350F; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">${rejectionReason}</p>
          </td>
        </tr>
      </table>` : ''}
      <p style="margin:0;">Please log in to your dashboard, update the listing to address the feedback above, and resubmit for review.</p>
    `

  await sendEmail({
    to: landlordEmail,
    subject,
    message,
    actionUrl: status === 'approved' ? `${baseUrl}/listing/${listingId}` : `${baseUrl}/landlord/listings`,
    actionLabel: status === 'approved' ? 'View Live Listing' : 'Update Listing',
  })

  console.log(`[email] Listing ${status} email sent to ${landlordEmail}`)
}

export async function sendVerificationStatusEmail({
  landlordEmail,
  landlordName,
  status,
  rejectionReason
}: {
  landlordEmail: string,
  landlordName: string,
  status: 'verified' | 'rejected',
  rejectionReason?: string
}): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://houseplug.ng'
  const firstName = landlordName.split(' ')[0]

  const subject = status === 'verified'
    ? `You're now a Verified Plug on HousePlug!`
    : `Action needed: Verification update`

  const message = status === 'verified'
    ? `
      <div style="background-color:#ECFDF5; border-left:4px solid #10B981; padding:16px 20px; border-radius:0 8px 8px 0; margin:0 0 28px;">
        <p style="margin:0; font-size:17px; font-weight:700; color:#065F46; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">&#10003;&nbsp; Account verified!</p>
      </div>
      <p style="margin:0 0 16px;">Hi <strong>${firstName}</strong>,</p>
      <p style="margin:0 0 16px;">Congratulations &mdash; your account has been <strong style="color:#10B981;">verified</strong>! You now carry the <strong>Verified Plug</strong> badge on all your listings.</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
        <tr>
          <td style="background-color:#F0FDF4; padding:20px 24px; border-radius:10px;">
            <p style="margin:0 0 10px; font-weight:700; color:#065F46; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">What verification unlocks:</p>
            <p style="margin:0 0 8px; font-size:14px; color:#374151; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">&#10003;&nbsp; <strong>Verified badge</strong> on every listing</p>
            <p style="margin:0 0 8px; font-size:14px; color:#374151; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">&#10003;&nbsp; <strong>Higher trust</strong> with students &mdash; more inquiries</p>
            <p style="margin:0; font-size:14px; color:#374151; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">&#10003;&nbsp; <strong>Priority placement</strong> in search results</p>
          </td>
        </tr>
      </table>
      <p style="margin:0;">Head to your dashboard to see your updated profile.</p>
    `
    : `
      <div style="background-color:#FFFBEB; border-left:4px solid #F59E0B; padding:16px 20px; border-radius:0 8px 8px 0; margin:0 0 28px;">
        <p style="margin:0; font-size:17px; font-weight:700; color:#92400E; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">&#9888;&nbsp; Verification unsuccessful</p>
      </div>
      <p style="margin:0 0 16px;">Hi <strong>${firstName}</strong>,</p>
      <p style="margin:0 0 16px;">We were unable to verify your account with the documents provided. Please review the feedback below and resubmit.</p>
      ${rejectionReason ? `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
        <tr>
          <td style="background-color:#FEF3C7; padding:16px 20px; border-radius:8px;">
            <p style="margin:0 0 6px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#92400E; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">Reason</p>
            <p style="margin:0; color:#78350F; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">${rejectionReason}</p>
          </td>
        </tr>
      </table>` : ''}
      <p style="margin:0; font-size:14px; color:#6B7280;">Ensure your ID is clear, well-lit, and fully visible. Your selfie should match the photo on the ID.</p>
    `

  await sendEmail({
    to: landlordEmail,
    subject,
    message,
    actionUrl: `${baseUrl}/landlord/verification`,
    actionLabel: status === 'verified' ? 'Go to Dashboard' : 'Retry Verification',
  })

  console.log(`[email] Verification ${status} email sent to ${landlordEmail}`)
}

export async function sendWelcomeEmail({
  email,
  fullName,
  role
}: {
  email: string,
  fullName: string,
  role: 'student' | 'landlord' | 'agent'
}): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://houseplug.ng'
  const firstName = fullName.split(' ')[0]

  const subject = `Welcome to HousePlug, ${firstName}!`

  const studentFeatures = [
    ['&#127737;', 'Verified Listings', 'Look for the Verified badge to rent from trusted, vetted landlords.'],
    ['&#128172;', 'Direct WhatsApp Access', 'One tap to message the landlord &mdash; no middleman, no extra fees.'],
    ['&#127979;', 'Filter by Campus', 'Find rooms within walking distance of your university.'],
  ]

  const landlordSteps = [
    ['1', '#1B4332', 'Create Your Listing', 'Add your property details, price, and high-quality photos.'],
    ['2', '#10B981', 'Get Verified', 'Submit your ID for the Verified badge &mdash; it drives 5x more leads.'],
    ['3', '#F59E0B', 'Respond Fast', 'Students contact you via WhatsApp. Quick replies win bookings.'],
  ]

  let message = `<p style="margin:0 0 20px;">Hi <strong>${firstName}</strong>,</p>`

  if (role === 'student') {
    message += `
      <p style="margin:0 0 24px;">Welcome to <strong>HousePlug</strong> &mdash; the easiest way to find student-friendly housing near your campus. Here's what you can do:</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${studentFeatures.map(([icon, title, desc]) => `
        <tr>
          <td style="padding:0 0 12px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color:#F9FAFB; padding:16px 20px; border-radius:10px;">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="font-size:26px; padding-right:14px; vertical-align:top;">${icon}</td>
                      <td style="vertical-align:top;">
                        <p style="margin:0 0 4px; font-weight:700; color:#111827; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">${title}</p>
                        <p style="margin:0; font-size:14px; color:#6B7280; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">${desc}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>`).join('')}
      </table>
      <p style="margin:20px 0 0; color:#6B7280; font-size:14px;">Your perfect plug is out there &mdash; go find it!</p>
    `
  } else {
    const roleLabel = role === 'agent' ? 'Agent' : 'Landlord'
    message += `
      <p style="margin:0 0 24px;">Welcome to the <strong>HousePlug</strong> family! You're joining thousands of ${roleLabel.toLowerCase()}s connecting with students every day. Here's how to get started:</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${landlordSteps.map(([num, color, title, desc]) => `
        <tr>
          <td style="padding:0 0 12px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="background-color:#F9FAFB; padding:16px 20px; border-radius:10px;">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="width:32px; height:32px; background-color:${color}; border-radius:50%; text-align:center; vertical-align:middle; padding-right:14px; flex-shrink:0;">
                        <span style="color:#ffffff; font-weight:800; font-size:14px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">&nbsp;${num}&nbsp;</span>
                      </td>
                      <td style="vertical-align:top; padding-left:4px;">
                        <p style="margin:0 0 4px; font-weight:700; color:#111827; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">${title}</p>
                        <p style="margin:0; font-size:14px; color:#6B7280; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">${desc}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>`).join('')}
      </table>
      <p style="margin:20px 0 0; color:#6B7280; font-size:14px;">Your first listing is just a few clicks away.</p>
    `
  }

  await sendEmail({
    to: email,
    subject,
    message,
    actionUrl: role === 'student' ? `${baseUrl}/browse` : `${baseUrl}/landlord/dashboard`,
    actionLabel: role === 'student' ? 'Start Exploring' : 'Go to Dashboard',
  })

  console.log(`[email] Welcome email sent to ${email} (${role})`)
}

export async function sendLandlordAnalyticsEmail({
  email,
  fullName,
  stats
}: {
  email: string,
  fullName: string,
  stats: {
    views: number,
    whatsapp: number,
    phone: number,
    activeListings: number
  }
}): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://houseplug.ng'
  const firstName = fullName.split(' ')[0]

  const subject = `Your weekly HousePlug performance report`

  const statCells = [
    { label: 'Total Views', value: stats.views.toLocaleString(), color: '#1B4332', bg: '#F0FDF4' },
    { label: 'WhatsApp Clicks', value: stats.whatsapp.toLocaleString(), color: '#10B981', bg: '#ECFDF5' },
    { label: 'Phone Reveals', value: stats.phone.toLocaleString(), color: '#F59E0B', bg: '#FFFBEB' },
    { label: 'Active Listings', value: String(stats.activeListings), color: '#3B82F6', bg: '#EFF6FF' },
  ]

  const message = `
    <p style="margin:0 0 16px;">Hi <strong>${firstName}</strong>,</p>
    <p style="margin:0 0 24px;">Here&rsquo;s how your listings performed on HousePlug this week:</p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
      <tr>
        ${statCells.slice(0, 2).map(s => `
        <td width="50%" style="padding:0 6px 12px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background-color:${s.bg}; padding:20px; border-radius:12px; text-align:center;">
                <p style="margin:0 0 6px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#6B7280; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">${s.label}</p>
                <p style="margin:0; font-size:30px; font-weight:800; color:${s.color}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">${s.value}</p>
              </td>
            </tr>
          </table>
        </td>`).join('')}
      </tr>
      <tr>
        ${statCells.slice(2).map((s, i) => `
        <td width="50%" style="padding:0 ${i === 0 ? '6px 0 0' : '0 0 0 6px'};">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="background-color:${s.bg}; padding:20px; border-radius:12px; text-align:center;">
                <p style="margin:0 0 6px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#6B7280; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">${s.label}</p>
                <p style="margin:0; font-size:30px; font-weight:800; color:${s.color}; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">${s.value}</p>
              </td>
            </tr>
          </table>
        </td>`).join('')}
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="background-color:#F9FAFB; padding:16px 20px; border-radius:10px; border-left:4px solid #1B4332;">
          <p style="margin:0; font-size:14px; color:#374151; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
            <strong>Pro tip:</strong> Listings with fresh photos and quick WhatsApp responses consistently rank higher and get more bookings.
          </p>
        </td>
      </tr>
    </table>
  `

  await sendEmail({
    to: email,
    subject,
    message,
    actionUrl: `${baseUrl}/landlord/dashboard`,
    actionLabel: 'View Full Analytics',
  })

  console.log(`[email] Analytics email sent to ${email}`)
}

export async function notifyAdminNewUser(fullName: string, email: string, role: string): Promise<void> {
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1)
  await sendAdminNotification(
    `New ${roleLabel} signed up`,
    `
      <p style="margin:0 0 20px;">A new user just joined HousePlug:</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="background-color:#F9FAFB; padding:20px 24px; border-radius:10px;">
            <p style="margin:0 0 10px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;"><span style="color:#6B7280; font-size:13px;">Name</span><br/><strong style="color:#111827;">${fullName}</strong></p>
            <p style="margin:0 0 10px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;"><span style="color:#6B7280; font-size:13px;">Email</span><br/><strong style="color:#111827;">${email}</strong></p>
            <p style="margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;"><span style="color:#6B7280; font-size:13px;">Role</span><br/><strong style="color:#1B4332;">${roleLabel}</strong></p>
          </td>
        </tr>
      </table>
    `,
    `${process.env.NEXT_PUBLIC_SITE_URL || 'https://houseplug.ng'}/admin/users`,
    "View in Admin Panel"
  )
}
