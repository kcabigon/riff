/**
 * Resend email service integration
 * Handles sending magic link emails and notification emails with custom branding
 */

import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function batchNotificationsEnabled(
  emails: string[]
): Promise<Set<string>> {
  if (emails.length === 0) return new Set();
  const users = await prisma.user.findMany({
    where: { email: { in: emails }, emailNotifications: true },
    select: { email: true },
  });
  return new Set(users.map((u) => u.email));
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
  unsubscribe = true,
}: {
  title: string;
  content: string;
  footerText: string;
  clubName?: string;
  unsubscribe?: boolean;
}): string {
  const baseUrl = process.env.NEXTAUTH_URL || "https://letsriff.app";
  const fullFooterText = unsubscribe
    ? `${footerText} · <a href="${baseUrl}/settings" style="color:#bbbbbb;">Unsubscribe</a>`
    : footerText;
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
              <p style="margin:0;font-size:12px;font-weight:300;color:#bbbbbb;font-family:'DM Sans',-apple-system,sans-serif;">${fullFooterText}</p>
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
                    <a href="${href}" style="display:block;font-size:17px;font-weight:300;color:#000000;text-decoration:none;font-family:'DM Sans',-apple-system,sans-serif;">${label}</a>
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
    unsubscribe: false,
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
    unsubscribe: false,
    footerText: `Button not working? Copy this link into your browser:<br><a href="${magicLink}" style="color:#888888;font-size:11px;word-break:break-all;">${magicLink}</a>`,
    content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">Welcome to Riff.</h1>
              <p style="margin:0 0 8px 0;font-size:16px;font-weight:300;color:#808080;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">For friends who write for fun.</p>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">You're one click away from joining your friends in a private space to share your writing. Let's get you set up!</p>
            </td>
          </tr>

          ${emailButton("Let's do this", magicLink)}

          <tr>
            <td style="padding:0 40px 40px;">
              <p style="margin:0;font-size:13px;font-weight:300;color:#999999;line-height:1.5;font-family:'DM Sans',-apple-system,sans-serif;">This link expires in 24 hours and can only be used once. If you didn't request this, ignore it.</p>
            </td>
          </tr>`,
  });
}

/**
 * Riff created email (notification layout — club name at top)
 */
function getRiffCreatedEmailTemplate({
  actorName,
  clubName,
  clubUrl,
}: {
  actorName: string;
  clubName: string;
  clubUrl: string;
  riffTitle?: string | null;
  prompt?: string | null;
  deadline?: Date | null;
}): string {
  return emailShell({
    title: `New riff in ${clubName}`,
    clubName,
    footerText: `You're receiving this because you're a member of ${clubName} on Riff.`,
    content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">New riff dropped.</h1>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;"><strong style="font-weight:500;">${actorName}</strong> started a new riff.</p>
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

  const titleLine = displayTitle
    ? `<strong style="font-weight:500;">${displayTitle}</strong> has been revealed.`
    : "A riff has been revealed.";

  return emailShell({
    title: `Riff revealed in ${clubName}`,
    clubName,
    footerText: `You're receiving this because you're a member of ${clubName} on Riff.`,
    content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">The pieces are in.</h1>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">${titleLine}</p>
            </td>
          </tr>

          ${emailButton("Read pieces", riffUrl)}`,
  });
}

// ==================== NOTIFICATION EMAILS ====================

function formatNames(names: string[]): string {
  if (names.length === 0) return "Someone";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names[0]}, ${names[1]}, and ${names.length - 2} other${names.length - 2 === 1 ? "" : "s"}`;
}

export async function sendMemberJoinedEmail({
  email,
  newMemberFullName,
  newMemberFirstName,
  clubName,
  clubUrl,
}: {
  email: string;
  newMemberFullName: string;
  newMemberFirstName: string;
  clubName: string;
  clubUrl: string;
}): Promise<void> {
  try {
    const { error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM || "Riff <noreply@localhost>",
      to: email,
      subject: `${newMemberFullName} joined ${clubName}`,
      html: emailShell({
        title: `${newMemberFullName} joined ${clubName}`,
        clubName,
        footerText: `You're receiving this because you're a member of ${clubName} on Riff.`,
        content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">${newMemberFullName} joined ${clubName}.</h1>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">More voices, more angles. More riffing.</p>
            </td>
          </tr>

          ${emailButton("Visit club", clubUrl)}`,
      }),
    });
    if (error) console.error("Resend error (memberJoined):", error);
  } catch (error) {
    console.error("Error sending member joined email:", error);
  }
}

export async function sendPieceSubmittedEmail({
  email,
  actorName,
  riffTitle,
  riffUrl,
  clubName,
}: {
  email: string;
  actorName: string;
  riffTitle: string;
  riffUrl: string;
  clubName: string;
}): Promise<void> {
  try {
    const { error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM || "Riff <noreply@localhost>",
      to: email,
      subject: `${actorName} submitted a piece to ${clubName}`,
      html: emailShell({
        title: `${actorName} submitted a piece to ${clubName}`,
        clubName,
        footerText: `You're receiving this because you're a participant in ${riffTitle} on Riff.`,
        content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">${actorName} submitted a piece to ${clubName}.</h1>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">Take a peek at the piece and riff progress.</p>
            </td>
          </tr>

          ${emailButton("Check it out", riffUrl)}`,
      }),
    });
    if (error) console.error("Resend error (pieceSubmitted):", error);
  } catch (error) {
    console.error("Error sending piece submitted email:", error);
  }
}

export async function sendDeadlineChangedEmail({
  email,
  hostName,
  newDeadline,
  riffUrl,
  clubName,
}: {
  email: string;
  hostName: string;
  newDeadline: Date;
  riffUrl: string;
  clubName: string;
}): Promise<void> {
  const deadlineStr = newDeadline.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  try {
    const { error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM || "Riff <noreply@localhost>",
      to: email,
      subject: `Riff deadline change in ${clubName}`,
      html: emailShell({
        title: `Riff deadline change in ${clubName}`,
        clubName,
        footerText: `You're receiving this because you're a member of ${clubName} on Riff.`,
        content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">Riff deadline change in ${clubName}.</h1>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">The new deadline is ${deadlineStr}.</p>
            </td>
          </tr>

          ${emailButton("View the riff", riffUrl)}`,
      }),
    });
    if (error) console.error("Resend error (deadlineChanged):", error);
  } catch (error) {
    console.error("Error sending deadline changed email:", error);
  }
}

export async function sendAllPiecesSubmittedEmail({
  email,
  riffTitle,
  clubName,
  riffUrl,
}: {
  email: string;
  riffTitle: string;
  clubName: string;
  riffUrl: string;
}): Promise<void> {
  try {
    const { error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM || "Riff <noreply@localhost>",
      to: email,
      subject: `All pieces submitted in ${clubName}`,
      html: emailShell({
        title: `All pieces submitted in ${clubName}`,
        clubName,
        footerText: `You're receiving this because you're the host of this riff on Riff.`,
        content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">All pieces submitted in ${clubName}.</h1>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">Everyone's in. You're ready for reveal.</p>
            </td>
          </tr>

          ${emailButton("Review and reveal", riffUrl)}`,
      }),
    });
    if (error) console.error("Resend error (allPiecesSubmitted):", error);
  } catch (error) {
    console.error("Error sending all pieces submitted email:", error);
  }
}

export async function sendCommentNotificationEmail({
  email,
  pieceTitle,
  commentCount,
  pieceUrl,
}: {
  email: string;
  pieceTitle: string;
  commentCount: number;
  pieceUrl: string;
}): Promise<void> {
  const commentLabel =
    commentCount === 1 ? "1 new comment" : `${commentCount} new comments`;

  try {
    const { error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM || "Riff <noreply@localhost>",
      to: email,
      subject: `New comments on "${pieceTitle}"`,
      html: emailShell({
        title: `New comments on "${pieceTitle}"`,
        footerText: `You're receiving this because someone commented on your writing on Riff.`,
        content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">New comments on "${pieceTitle}".</h1>
              <p style="margin:0 0 16px 0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">${commentLabel} just came in.</p>
            </td>
          </tr>

          ${emailButton("View comments", pieceUrl)}`,
      }),
    });
    if (error) console.error("Resend error (commentNotification):", error);
  } catch (error) {
    console.error("Error sending comment notification email:", error);
  }
}
