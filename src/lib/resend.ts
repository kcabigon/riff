/**
 * Resend email service integration
 * Handles sending magic link emails and notification emails with custom branding
 */

import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const EMAIL_LOGO_URL =
  "https://wmqlbbtgexpsxzwwurpi.supabase.co/storage/v1/object/public/images/riff-wordmark-email.png";

// ==================== SHARED EMAIL HELPERS ====================

/**
 * Wraps email content in the standard Riff email shell:
 * table-based layout, inline styles, logo, divider, footer.
 *
 * Two layouts:
 * - Auth (clubName omitted): large Riff logo at top
 * - Notification (clubName set): club name header at top, small logo below footer
 */
function emailShell({
  title,
  content,
  footerText,
  clubName,
}: {
  title: string;
  content: string;
  footerText: string;
  clubName?: string;
}): string {
  const topSection = clubName
    ? `<!-- Club name header -->
          <tr>
            <td style="padding:40px 40px 24px;">
              <p style="margin:0;font-size:16px;font-weight:500;color:#000000;letter-spacing:2px;text-transform:uppercase;font-family:'DM Sans',-apple-system,sans-serif;">${clubName}</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="height:2px;background-color:#000000;font-size:0;line-height:0;">&nbsp;</td></tr></table>
            </td>
          </tr>`
    : `<!-- Logo -->
          <tr>
            <td align="center" style="padding:48px 40px 32px;">
              <img src="${EMAIL_LOGO_URL}" alt="Riff" width="200" height="132" style="display:block;margin:0 auto;" />
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="height:2px;background-color:#000000;font-size:0;line-height:0;">&nbsp;</td></tr></table>
            </td>
          </tr>`;

  const bottomLogo = clubName
    ? `<!-- Small logo -->
          <tr>
            <td align="center" style="padding:0 40px 24px;">
              <img src="${EMAIL_LOGO_URL}" alt="Riff" width="60" height="40" style="display:block;margin:0 auto;" />
            </td>
          </tr>`
    : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=DM+Serif+Text&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:48px 24px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background-color:#ffffff;border:2px solid #000000;">

          ${topSection}

          ${content}

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px ${clubName ? "12px" : "32px"};border-top:1px solid #eeeeee;">
              <p style="margin:0;font-size:12px;font-weight:300;color:#bbbbbb;font-family:'DM Sans',-apple-system,sans-serif;">${footerText}</p>
            </td>
          </tr>

          ${bottomLogo}

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
}

/** Email-safe CTA button with 8px offset shadow using nested tables */
function emailButton(label: string, href: string): string {
  return `
          <tr>
            <td style="padding:32px 40px 40px 40px;">
              <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:0;">
                <tr>
                  <td style="background-color:#00FF66;border:2px solid #000000;padding:14px 0;text-align:center;">
                    <a href="${href}" style="font-size:17px;font-weight:300;color:#000000;text-decoration:none;font-family:'DM Sans',-apple-system,sans-serif;">${label}</a>
                  </td>
                  <td width="8" style="width:8px;min-width:8px;padding:0;font-size:0;line-height:0;background-color:#000000;background-image:linear-gradient(to bottom, #ffffff 8px, #000000 8px);">&nbsp;</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding:0;font-size:0;line-height:0;">
                    <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:0;">
                      <tr>
                        <td width="8" height="8" style="width:8px;height:8px;background-color:#ffffff;padding:0;font-size:0;line-height:0;">&nbsp;</td>
                        <td style="background-color:#000000;height:8px;padding:0;font-size:0;line-height:0;">&nbsp;</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
}

// ==================== SEND FUNCTIONS ====================

/**
 * Send a magic link email for authentication (existing users)
 */
export async function sendSignInEmail(
  email: string,
  magicLink: string
): Promise<void> {
  try {
    const { data, error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM || "Riff <noreply@localhost>",
      to: email,
      subject: "Sign in to Riff",
      html: getSignInEmailTemplate(magicLink),
    });

    if (error) {
      console.error("Resend API error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log("Sign-in email sent successfully:", data);
  } catch (error) {
    console.error("Error sending sign-in email:", error);
    throw error;
  }
}

/**
 * Send an onboarding email for new users
 */
export async function sendOnboardingEmail(
  email: string,
  magicLink: string
): Promise<void> {
  try {
    const { data, error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM || "Riff <noreply@localhost>",
      to: email,
      subject: "Welcome to Riff!",
      html: getOnboardingEmailTemplate(magicLink),
    });

    if (error) {
      console.error("Resend API error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log("Onboarding email sent successfully:", data);
  } catch (error) {
    console.error("Error sending onboarding email:", error);
    throw error;
  }
}

/**
 * Send a club invitation email
 */
export async function sendClubInviteEmail(
  email: string,
  clubName: string,
  inviteUrl: string,
  inviterName: string
): Promise<void> {
  try {
    const { data, error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM || "Riff <noreply@localhost>",
      to: email,
      subject: `${inviterName} invited you to join ${clubName} on Riff`,
      html: getClubInviteEmailTemplate(clubName, inviteUrl, inviterName),
    });

    if (error) {
      console.error("Resend API error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log("Club invite email sent successfully:", data);
  } catch (error) {
    console.error("Error sending club invite email:", error);
    throw error;
  }
}

/**
 * Send a riff created email to a club member
 */
export async function sendRiffCreatedEmail({
  email,
  actorName,
  clubName,
  clubUrl,
  riffTitle,
  prompt,
  deadline,
}: {
  email: string;
  actorName: string;
  clubName: string;
  clubUrl: string;
  riffTitle?: string | null;
  prompt?: string | null;
  deadline?: Date | null;
}): Promise<void> {
  try {
    const { data, error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM || "Riff <noreply@localhost>",
      to: email,
      subject: `New riff in ${clubName}`,
      html: getRiffCreatedEmailTemplate({
        actorName,
        clubName,
        clubUrl,
        riffTitle,
        prompt,
        deadline,
      }),
    });

    if (error) {
      console.error("Resend API error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log("Riff created email sent successfully:", data);
  } catch (error) {
    console.error("Error sending riff created email:", error);
    throw error;
  }
}

/**
 * Send a riff revealed email to a club member
 */
export async function sendRiffRevealedEmail({
  email,
  clubName,
  riffUrl,
  riffTitle,
  volumeNumber,
  pieceCount,
}: {
  email: string;
  clubName: string;
  riffUrl: string;
  riffTitle?: string | null;
  volumeNumber?: number | null;
  pieceCount: number;
}): Promise<void> {
  try {
    const { data, error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM || "Riff <noreply@localhost>",
      to: email,
      subject: `Riff revealed in ${clubName}`,
      html: getRiffRevealedEmailTemplate({
        clubName,
        riffUrl,
        riffTitle,
        volumeNumber,
        pieceCount,
      }),
    });

    if (error) {
      console.error("Resend API error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log("Riff revealed email sent successfully:", data);
  } catch (error) {
    console.error("Error sending riff revealed email:", error);
    throw error;
  }
}

/**
 * Send a batched comment digest email
 */
export async function sendCommentDigestEmail({
  email,
  recipientName,
  pieceTitle,
  commentCount,
  actorNames,
  pieceUrl,
}: {
  email: string;
  recipientName: string;
  pieceTitle: string;
  commentCount: number;
  actorNames: string;
  pieceUrl: string;
}): Promise<void> {
  const subject = `${commentCount} new comment${commentCount > 1 ? "s" : ""} on "${pieceTitle}"`;

  try {
    const { data, error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM || "Riff <noreply@localhost>",
      to: email,
      subject,
      html: getCommentDigestEmailTemplate({
        recipientName,
        pieceTitle,
        commentCount,
        actorNames,
        pieceUrl,
      }),
    });

    if (error) {
      console.error("Resend API error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log("Comment digest email sent successfully:", data);
  } catch (error) {
    console.error("Error sending comment digest email:", error);
    throw error;
  }
}

/**
 * Legacy function name for backward compatibility
 * @deprecated Use sendSignInEmail or sendOnboardingEmail instead
 */
export async function sendMagicLinkEmail(
  email: string,
  magicLink: string
): Promise<void> {
  return sendSignInEmail(email, magicLink);
}

// ==================== EMAIL TEMPLATES ====================

/**
 * Sign-in email (auth layout — big logo at top)
 */
function getSignInEmailTemplate(magicLink: string): string {
  return emailShell({
    title: "Sign in to Riff",
    footerText: `Button not working? Copy this link into your browser:<br><a href="${magicLink}" style="color:#888888;font-size:11px;word-break:break-all;">${magicLink}</a>`,
    content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">You've got a magic link.</h1>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">Tap the button below to sign in to Riff. This link is yours — don't share it.</p>
            </td>
          </tr>

          ${emailButton("Sign in to Riff", magicLink)}

          <tr>
            <td style="padding:0 40px 40px;">
              <p style="margin:0;font-size:13px;font-weight:300;color:#999999;line-height:1.5;font-family:'DM Sans',-apple-system,sans-serif;">This link expires in 24 hours and can only be used once. If you didn't request this, ignore it.</p>
            </td>
          </tr>`,
  });
}

/**
 * Onboarding email for new users (auth layout — big logo at top)
 */
function getOnboardingEmailTemplate(magicLink: string): string {
  return emailShell({
    title: "Welcome to Riff",
    footerText: `Button not working? Copy this link into your browser:<br><a href="${magicLink}" style="color:#888888;font-size:11px;word-break:break-all;">${magicLink}</a>`,
    content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">Welcome to Riff.</h1>
              <p style="margin:0 0 8px 0;font-size:16px;font-weight:300;color:#808080;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">For friends who write for fun.</p>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">You're one click away from joining your friends in a private space to share your writing. Let's get you set up!</p>
            </td>
          </tr>

          ${emailButton("Let's do this shit", magicLink)}

          <tr>
            <td style="padding:0 40px 40px;">
              <p style="margin:0;font-size:13px;font-weight:300;color:#999999;line-height:1.5;font-family:'DM Sans',-apple-system,sans-serif;">This link expires in 24 hours and can only be used once. If you didn't request this, ignore it.</p>
            </td>
          </tr>`,
  });
}

/**
 * Club invitation email (auth layout — invitee may not be a user yet)
 */
function getClubInviteEmailTemplate(
  clubName: string,
  inviteUrl: string,
  inviterName: string
): string {
  return emailShell({
    title: `Join ${clubName} on Riff`,
    footerText: `Button not working? Copy this link into your browser:<br><a href="${inviteUrl}" style="color:#888888;font-size:11px;word-break:break-all;">${inviteUrl}</a><br><br>If you don't know ${inviterName} or didn't expect this invitation, you can safely ignore this email.`,
    content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">You're invited.</h1>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;"><strong style="font-weight:500;">${inviterName}</strong> has invited you to join their club on Riff:</p>
            </td>
          </tr>

          <!-- Club name box -->
          <tr>
            <td style="padding:8px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #000000;background-color:#FAFAFA;">
                <tr>
                  <td style="padding:24px;text-align:center;">
                    <p style="font-size:20px;font-weight:500;color:#000000;margin:0;font-family:'DM Sans',-apple-system,sans-serif;">${clubName}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 40px 0;">
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">Riff is a private space for friends to share their writing, give feedback, and connect through long-form creativity.</p>
            </td>
          </tr>

          ${emailButton("Join Club", inviteUrl)}`,
  });
}

/**
 * Riff created email (notification layout — club name at top)
 */
function getRiffCreatedEmailTemplate({
  actorName,
  clubName,
  clubUrl,
  riffTitle,
  prompt,
  deadline,
}: {
  actorName: string;
  clubName: string;
  clubUrl: string;
  riffTitle?: string | null;
  prompt?: string | null;
  deadline?: Date | null;
}): string {
  const deadlineStr = deadline
    ? deadline.toLocaleDateString("en-US", { month: "long", day: "numeric" })
    : null;
  const daysFromNow = deadline
    ? Math.round(
        (deadline.getTime() - new Date().setHours(0, 0, 0, 0)) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const titleBlock = riffTitle
    ? `<p style="font-size:20px;font-weight:500;color:#000000;margin:0 0 16px 0;font-family:'DM Sans',-apple-system,sans-serif;">${riffTitle}</p>`
    : "";

  const promptBlock = prompt
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
                <tr><td width="3" style="width:3px;background-color:#000000;"></td><td style="padding:0 0 0 16px;"><p style="font-size:16px;font-weight:300;color:#000000;margin:0;line-height:1.6;font-style:italic;font-family:'DM Sans',-apple-system,sans-serif;">${prompt}</p></td></tr>
              </table>`
    : "";

  const deadlineBlock =
    deadlineStr && daysFromNow !== null
      ? `<p style="font-size:14px;font-weight:300;color:#808080;margin:16px 0 0 0;font-family:'DM Sans',-apple-system,sans-serif;">Deadline: ${deadlineStr} &middot; ${daysFromNow} day${daysFromNow === 1 ? "" : "s"} from now</p>`
      : "";

  return emailShell({
    title: `New riff in ${clubName}`,
    clubName,
    footerText: `You're receiving this because you're a member of ${clubName} on Riff.`,
    content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">New riff dropped.</h1>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;"><strong style="font-weight:500;">${actorName}</strong> just started a new riff in <strong style="font-weight:500;">${clubName}</strong>.</p>
            </td>
          </tr>

          <!-- Riff details box -->
          <tr>
            <td style="padding:8px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #000000;background-color:#FAFAFA;">
                <tr><td style="padding:24px;">
                  ${titleBlock}
                  ${promptBlock}
                  ${deadlineBlock}
                </td></tr>
              </table>
            </td>
          </tr>

          ${emailButton("Join riff", clubUrl)}`,
  });
}

/**
 * Riff revealed email (notification layout — club name at top)
 */
function getRiffRevealedEmailTemplate({
  clubName,
  riffUrl,
  riffTitle,
  volumeNumber,
  pieceCount,
}: {
  clubName: string;
  riffUrl: string;
  riffTitle?: string | null;
  volumeNumber?: number | null;
  pieceCount: number;
}): string {
  const displayTitle = volumeNumber
    ? riffTitle
      ? `Volume ${volumeNumber}: ${riffTitle}`
      : `Volume ${volumeNumber}`
    : riffTitle || null;

  const titleBlock = displayTitle
    ? `<p style="font-size:20px;font-weight:500;color:#000000;margin:0 0 12px 0;font-family:'DM Sans',-apple-system,sans-serif;">${displayTitle}</p>`
    : "";

  const pieceLabel = pieceCount === 1 ? "1 piece" : `${pieceCount} pieces`;

  return emailShell({
    title: `Riff revealed in ${clubName}`,
    clubName,
    footerText: `You're receiving this because you're a member of ${clubName} on Riff.`,
    content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">The pieces are in.</h1>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">A riff in <strong style="font-weight:500;">${clubName}</strong> has been revealed.</p>
            </td>
          </tr>

          <!-- Riff details box -->
          <tr>
            <td style="padding:8px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #000000;background-color:#FAFAFA;">
                <tr><td style="padding:24px;">
                  ${titleBlock}
                  <p style="font-size:16px;font-weight:300;color:#808080;margin:0;font-family:'DM Sans',-apple-system,sans-serif;">${pieceLabel} submitted</p>
                </td></tr>
              </table>
            </td>
          </tr>

          ${emailButton("Read pieces", riffUrl)}`,
  });
}

/**
 * Comment digest email (notification layout — club name at top)
 */
function getCommentDigestEmailTemplate({
  recipientName,
  pieceTitle,
  commentCount,
  actorNames,
  pieceUrl,
}: {
  recipientName: string;
  pieceTitle: string;
  commentCount: number;
  actorNames: string;
  pieceUrl: string;
}): string {
  const commentLabel =
    commentCount === 1 ? "1 new comment" : `${commentCount} new comments`;

  return emailShell({
    title: `${commentLabel} on "${pieceTitle}"`,
    footerText:
      "You're receiving this because someone commented on your writing on Riff.",
    content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">The riff goes on.</h1>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">Hey ${recipientName}, ${actorNames} left comments on your piece.</p>
            </td>
          </tr>

          <!-- Comment details box -->
          <tr>
            <td style="padding:8px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #000000;background-color:#FAFAFA;">
                <tr><td style="padding:24px;">
                  <p style="font-size:20px;font-weight:500;color:#000000;margin:0 0 12px 0;font-family:'DM Sans',-apple-system,sans-serif;">${pieceTitle}</p>
                  <p style="font-size:16px;font-weight:300;color:#808080;margin:0;font-family:'DM Sans',-apple-system,sans-serif;">${commentLabel}</p>
                </td></tr>
              </table>
            </td>
          </tr>

          ${emailButton("Read comments", pieceUrl)}`,
  });
}
