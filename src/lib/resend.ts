/**
 * Resend email service integration
 * Handles sending magic link emails and notification emails with custom branding
 */

import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/env";

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

// Gates the recurring nudges (deadline approaching, remember-to-write,
// join-riff-nudge) on the "Reminders" toggle — repurposes the previously
// unused emailMarketing column so these can be silenced independently of
// the one-time alerts gated by emailNotifications.
export async function batchRemindersEnabled(
  emails: string[]
): Promise<Set<string>> {
  if (emails.length === 0) return new Set();
  const users = await prisma.user.findMany({
    where: { email: { in: emails }, emailMarketing: true },
    select: { email: true },
  });
  return new Set(users.map((u) => u.email));
}

const EMAIL_LOGO_URL =
  "https://wmqlbbtgexpsxzwwurpi.supabase.co/storage/v1/object/public/images/riff-wordmark-email.png";

// ==================== SHARED EMAIL HELPERS ====================

// Everything an email needs except its recipient. Each email has a build
// function returning one of these and a send function that delivers it, so the
// dev preview page (/dev/emails) can render the exact email a send would
// produce without sending anything.
export interface BuiltEmail {
  subject: string;
  // Also rendered inside html as a hidden preheader; carried separately so the
  // preview page can show it the way an inbox would.
  preview?: string;
  html: string;
}

// The inbox preview line. Hidden in the opened email; the trailing run of
// zero-width spaces stops clients from padding the preview with body text.
function preheader(text: string): string {
  return `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#ffffff;">${text}${"&#847;&zwnj;&nbsp;".repeat(60)}</div>`;
}

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
  preview,
}: {
  title: string;
  content: string;
  footerText: string;
  clubName?: string;
  unsubscribe?: boolean;
  preview?: string;
}): string {
  const baseUrl = getBaseUrl();
  const fullFooterText = unsubscribe
    ? `${footerText} · <a href="${baseUrl}/account" style="color:#bbbbbb;">Unsubscribe</a>`
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
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${preview ? `\n  ${preheader(preview)}` : ""}

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

export function buildSignInEmail(magicLink: string): BuiltEmail {
  return {
    subject: "Sign in to Riff",
    html: getSignInEmailTemplate(magicLink),
  };
}

/**
 * Send a magic link email for authentication (existing users)
 */
export async function sendSignInEmail(
  email: string,
  magicLink: string
): Promise<void> {
  try {
    const { subject, html } = buildSignInEmail(magicLink);
    const { data, error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM || "Riff <noreply@localhost>",
      to: email,
      subject,
      html,
    });

    if (error) {
      console.error("Resend API error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.info("Sign-in email sent successfully:", data);
  } catch (error) {
    console.error("Error sending sign-in email:", error);
    throw error;
  }
}

export function buildOnboardingEmail(magicLink: string): BuiltEmail {
  return {
    subject: "Welcome to Riff!",
    html: getOnboardingEmailTemplate(magicLink),
  };
}

/**
 * Send an onboarding email for new users
 */
export async function sendOnboardingEmail(
  email: string,
  magicLink: string
): Promise<void> {
  try {
    const { subject, html } = buildOnboardingEmail(magicLink);
    const { data, error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM || "Riff <noreply@localhost>",
      to: email,
      subject,
      html,
    });

    if (error) {
      console.error("Resend API error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.info("Onboarding email sent successfully:", data);
  } catch (error) {
    console.error("Error sending onboarding email:", error);
    throw error;
  }
}

interface RiffCreatedEmailParams {
  // Omitted for cron-created riffs — see getRiffCreatedEmailTemplate.
  actorName?: string | null;
  clubName: string;
  riffUrl: string;
  riffTitle?: string | null;
  prompt?: string | null;
  deadline?: Date | null;
}

export function buildRiffCreatedEmail(
  params: RiffCreatedEmailParams
): BuiltEmail {
  return {
    subject: `New riff in ${params.clubName}`,
    html: getRiffCreatedEmailTemplate(params),
  };
}

/**
 * Send a riff created email to a club member
 */
export async function sendRiffCreatedEmail({
  email,
  ...params
}: RiffCreatedEmailParams & { email: string }): Promise<void> {
  try {
    const { subject, html } = buildRiffCreatedEmail(params);
    const { data, error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM || "Riff <noreply@localhost>",
      to: email,
      subject,
      html,
    });

    if (error) {
      console.error("Resend API error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.info("Riff created email sent successfully:", data);
  } catch (error) {
    console.error("Error sending riff created email:", error);
    throw error;
  }
}

interface RiffRevealedEmailParams {
  clubName: string;
  riffUrl: string;
  riffTitle?: string | null;
  volumeNumber?: number | null;
  pieceCount: number;
}

export function buildRiffRevealedEmail(
  params: RiffRevealedEmailParams
): BuiltEmail {
  return {
    subject: `Riff revealed in ${params.clubName}`,
    html: getRiffRevealedEmailTemplate(params),
  };
}

/**
 * Send a riff revealed email to a club member
 */
export async function sendRiffRevealedEmail({
  email,
  ...params
}: RiffRevealedEmailParams & { email: string }): Promise<void> {
  try {
    const { subject, html } = buildRiffRevealedEmail(params);
    const { data, error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM || "Riff <noreply@localhost>",
      to: email,
      subject,
      html,
    });

    if (error) {
      console.error("Resend API error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.info("Riff revealed email sent successfully:", data);
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
              <p style="margin:0;font-size:13px;font-weight:300;color:#9C9C9C;line-height:1.5;font-family:'DM Sans',-apple-system,sans-serif;">This link expires in 24 hours and can only be used once. If you didn't request this, ignore it.</p>
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
              <p style="margin:0;font-size:13px;font-weight:300;color:#9C9C9C;line-height:1.5;font-family:'DM Sans',-apple-system,sans-serif;">This link expires in 24 hours and can only be used once. If you didn't request this, ignore it.</p>
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
  riffUrl,
}: {
  // Absent when the cadence cron opened the riff. A riff the cron created has
  // no author — its creatorId is the club admin, but only because the column is
  // non-nullable, and telling the club that person started it would be false.
  actorName?: string | null;
  clubName: string;
  riffUrl: string;
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
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">${
                actorName
                  ? `<strong style="font-weight:500;">${actorName}</strong> started a new riff.`
                  : `A new riff is open in <strong style="font-weight:500;">${clubName}</strong>.`
              }</p>
            </td>
          </tr>

          ${emailButton("Let's riff", riffUrl)}`,
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

interface MemberJoinedEmailParams {
  newMemberFullName: string;
  newMemberFirstName: string;
  clubName: string;
  clubUrl: string;
}

export function buildMemberJoinedEmail({
  newMemberFullName,
  clubName,
  clubUrl,
}: MemberJoinedEmailParams): BuiltEmail {
  return {
    subject: `${newMemberFullName} joined ${clubName}`,
    html: emailShell({
      title: `${newMemberFullName} joined ${clubName}`,
      clubName,
      footerText: `You're receiving this because you're a member of ${clubName} on Riff.`,
      content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">${newMemberFullName} joined ${clubName}.</h1>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">Riff on, baby.</p>
            </td>
          </tr>

          ${emailButton("Visit club", clubUrl)}`,
    }),
  };
}

export async function sendMemberJoinedEmail({
  email,
  ...params
}: MemberJoinedEmailParams & { email: string }): Promise<void> {
  try {
    const { subject, html } = buildMemberJoinedEmail(params);
    const { error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM || "Riff <noreply@localhost>",
      to: email,
      subject,
      html,
    });
    if (error) console.error("Resend error (memberJoined):", error);
  } catch (error) {
    console.error("Error sending member joined email:", error);
  }
}

interface PieceSubmittedEmailParams {
  actorName: string;
  riffTitle: string;
  riffUrl: string;
  clubName: string;
}

export function buildPieceSubmittedEmail({
  actorName,
  riffTitle,
  riffUrl,
  clubName,
}: PieceSubmittedEmailParams): BuiltEmail {
  return {
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
  };
}

export async function sendPieceSubmittedEmail({
  email,
  ...params
}: PieceSubmittedEmailParams & { email: string }): Promise<void> {
  try {
    const { subject, html } = buildPieceSubmittedEmail(params);
    const { error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM || "Riff <noreply@localhost>",
      to: email,
      subject,
      html,
    });
    if (error) console.error("Resend error (pieceSubmitted):", error);
  } catch (error) {
    console.error("Error sending piece submitted email:", error);
  }
}

interface PieceSharedEmailParams {
  actorName: string;
  pieceTitle: string;
  pieceUrl: string;
}

// Send section of the Share modal — author picked this specific friend to
// notify about a piece they already have Friends-tier access to (no join
// step, straight to /read/[pieceId]).
export function buildPieceSharedEmail({
  actorName,
  pieceTitle,
  pieceUrl,
}: PieceSharedEmailParams): BuiltEmail {
  return {
    subject: `${actorName} shared a piece with you`,
    html: emailShell({
      title: `&ldquo;${pieceTitle}&rdquo; by ${actorName} is shared with you`,
      footerText: `You're receiving this because ${actorName} shared a piece with you on Riff.`,
      content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">&ldquo;${pieceTitle}&rdquo; by ${actorName} is shared with you.</h1>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">Take a look when you get a chance.</p>
            </td>
          </tr>

          ${emailButton("Read it", pieceUrl)}`,
    }),
  };
}

export async function sendPieceSharedEmail({
  email,
  ...params
}: PieceSharedEmailParams & { email: string }): Promise<void> {
  try {
    const { subject, html } = buildPieceSharedEmail(params);
    const { error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM || "Riff <noreply@localhost>",
      to: email,
      subject,
      html,
    });
    if (error) console.error("Resend error (pieceShared):", error);
  } catch (error) {
    console.error("Error sending piece shared email:", error);
  }
}

interface RiffGracePeriodEmailParams {
  clubName: string;
  riffUrl: string;
  newDeadline: Date;
}

// The cadence cron's grace-week warning: a whole period went by with nobody
// writing, so the deadline moves once and the club is told what happens if it
// stays quiet. Separate from sendDeadlineChangedEmail rather than a variant of
// it, because that one is also sent when a host reschedules by hand — putting
// this copy there would tell a club it was about to be paused every time its
// host moved a date.
export function buildRiffGracePeriodEmail({
  clubName,
  riffUrl,
  newDeadline,
}: RiffGracePeriodEmailParams): BuiltEmail {
  const deadlineStr = newDeadline.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
  return {
    subject: `One more week for ${clubName}`,
    html: emailShell({
      title: `One more week for ${clubName}`,
      clubName,
      footerText: `You're receiving this because you're a member of ${clubName} on Riff.`,
      content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">Nobody wrote anything this round.</h1>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">${clubName} has until ${deadlineStr} — one more week. If nothing gets submitted by then, the club's riff schedule pauses until someone turns it back on.</p>
            </td>
          </tr>

          ${emailButton("Write something", riffUrl)}`,
    }),
  };
}

export async function sendRiffGracePeriodEmail({
  email,
  ...params
}: RiffGracePeriodEmailParams & { email: string }): Promise<void> {
  try {
    const { subject, html } = buildRiffGracePeriodEmail(params);
    const { error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM || "Riff <noreply@localhost>",
      to: email,
      subject,
      html,
    });
    if (error) console.error("Resend error (riffGracePeriod):", error);
  } catch (error) {
    console.error("Error sending riff grace period email:", error);
  }
}

interface DeadlineChangedEmailParams {
  newDeadline: Date;
  riffUrl: string;
  clubName: string;
}

// Deliberately actor-free: a deadline moves because the host rescheduled it, and
// the club has no reason to care who. The cadence cron does not use this — its
// one extension is the grace week above, which needs to explain itself.
export function buildDeadlineChangedEmail({
  newDeadline,
  riffUrl,
  clubName,
}: DeadlineChangedEmailParams): BuiltEmail {
  const deadlineStr = newDeadline.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return {
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
  };
}

export async function sendDeadlineChangedEmail({
  email,
  ...params
}: DeadlineChangedEmailParams & { email: string }): Promise<void> {
  try {
    const { subject, html } = buildDeadlineChangedEmail(params);
    const { error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM || "Riff <noreply@localhost>",
      to: email,
      subject,
      html,
    });
    if (error) console.error("Resend error (deadlineChanged):", error);
  } catch (error) {
    console.error("Error sending deadline changed email:", error);
  }
}

interface ReminderEmailVariant {
  subject: string;
  headline: string;
  body: string;
}

// Deadline-approaching copy is picked by urgency tier (>7 / 3-7 / <3 days
// remaining), not by send count — the joke should get more urgent as the
// deadline nears, not rotate arbitrarily.
function deadlineApproachingVariant(
  daysRemaining: number,
  clubName: string,
  riffTitle: string,
  deadlineStr: string,
  dayLabel: string
): ReminderEmailVariant {
  if (daysRemaining > 7) {
    return {
      subject: `${riffTitle} closes ${dayLabel}`,
      headline: `Plenty of time. Famous last words.`,
      body: `The deadline's ${deadlineStr}. Get your piece in before ${clubName} moves on without you.`,
    };
  }
  if (daysRemaining >= 3) {
    return {
      subject: `1.21 gigawatts won't save this deadline`,
      headline: `1.21 gigawatts won't save this deadline.`,
      body: `${riffTitle} closes ${dayLabel}. Time travel's not real — get your piece in before ${clubName} moves on.`,
    };
  }
  return {
    subject: `This deadline will self-destruct ${dayLabel}`,
    headline: `This deadline will self-destruct ${dayLabel}.`,
    body: `${riffTitle} closes ${deadlineStr}. Get your piece in — this offer won't repeat itself.`,
  };
}

// Remember-to-write and join-riff-nudge cycle through a fixed pool of copy
// by send number (variantIndex = how many times this reminder has already
// gone out to this person for this riff), so a repeat nudge doesn't repeat
// the same joke.
const REMEMBER_TO_WRITE_VARIANTS: Array<
  (clubName: string, riffTitle: string) => ReminderEmailVariant
> = [
  (clubName, riffTitle) => ({
    subject: `The first rule of ${clubName}`,
    headline: `The first rule of ${clubName}: you gotta write something.`,
    body: `You joined ${riffTitle} — now all that's missing is your piece.`,
  }),
  (clubName, riffTitle) => ({
    subject: `If you write it...`,
    headline: `If you write it, they will read it.`,
    body: `${riffTitle}'s waiting on your piece in ${clubName}.`,
  }),
  (clubName) => ({
    subject: `${clubName}, show me the words`,
    headline: `${clubName}, show me the words.`,
    body: `You joined this riff — time to put something on the page.`,
  }),
  (clubName, riffTitle) => ({
    subject: `Isn't it ironic?`,
    headline: `Isn't it ironic?`,
    body: `You joined ${riffTitle} in ${clubName} but haven't written a word yet. A little too ironic, don't you think?`,
  }),
];

const JOIN_RIFF_NUDGE_VARIANTS: Array<
  (clubName: string, riffTitle: string) => ReminderEmailVariant
> = [
  (clubName, riffTitle) => ({
    subject: `Looks like you got left behind`,
    headline: `${clubName} started riffing... and you got left behind.`,
    body: `${riffTitle}'s underway. Don't miss the party.`,
  }),
  (clubName, riffTitle) => ({
    subject: `Smells like team spirit`,
    headline: `${clubName} is riffing, and it smells like team spirit.`,
    body: `${riffTitle}'s underway — everyone's in but you.`,
  }),
  (clubName, riffTitle) => ({
    subject: `Insert coin to continue`,
    headline: `${clubName}'s riffing — insert coin to continue.`,
    body: `${riffTitle} is live and waiting on your next move.`,
  }),
];

// The three reminder templates share one layout and differ only in copy,
// footer and button, so they share this renderer.
function buildReminderEmail({
  variant,
  clubName,
  footerText,
  buttonLabel,
  riffUrl,
}: {
  variant: ReminderEmailVariant;
  clubName: string;
  footerText: string;
  buttonLabel: string;
  riffUrl: string;
}): BuiltEmail {
  return {
    subject: variant.subject,
    html: emailShell({
      title: variant.headline,
      clubName,
      footerText,
      content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">${variant.headline}</h1>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">${variant.body}</p>
            </td>
          </tr>

          ${emailButton(buttonLabel, riffUrl)}`,
    }),
  };
}

interface DeadlineApproachingEmailParams {
  riffTitle: string;
  clubName: string;
  riffUrl: string;
  deadline: Date;
  daysRemaining: number;
}

export function buildDeadlineApproachingEmail({
  riffTitle,
  clubName,
  riffUrl,
  deadline,
  daysRemaining,
}: DeadlineApproachingEmailParams): BuiltEmail {
  const deadlineStr = deadline.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
  const dayLabel =
    daysRemaining <= 0
      ? "today"
      : daysRemaining === 1
        ? "tomorrow"
        : `in ${daysRemaining} days`;
  return buildReminderEmail({
    variant: deadlineApproachingVariant(
      daysRemaining,
      clubName,
      riffTitle,
      deadlineStr,
      dayLabel
    ),
    clubName,
    footerText: `You're receiving this because you haven't submitted a piece to ${riffTitle} yet.`,
    buttonLabel: "Finish your piece",
    riffUrl,
  });
}

export async function sendDeadlineApproachingEmail({
  email,
  ...params
}: DeadlineApproachingEmailParams & { email: string }): Promise<boolean> {
  try {
    const { subject, html } = buildDeadlineApproachingEmail(params);
    const { error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM || "Riff <noreply@localhost>",
      to: email,
      subject,
      html,
    });
    if (error) {
      console.error("Resend error (deadlineApproaching):", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error sending deadline approaching email:", error);
    return false;
  }
}

interface RotatingReminderEmailParams {
  riffTitle: string;
  clubName: string;
  riffUrl: string;
  variantIndex: number;
}

export function buildRememberToWriteEmail({
  riffTitle,
  clubName,
  riffUrl,
  variantIndex,
}: RotatingReminderEmailParams): BuiltEmail {
  return buildReminderEmail({
    variant: REMEMBER_TO_WRITE_VARIANTS[
      variantIndex % REMEMBER_TO_WRITE_VARIANTS.length
    ](clubName, riffTitle),
    clubName,
    footerText: `You're receiving this because you joined ${riffTitle} in ${clubName} but haven't started writing yet.`,
    buttonLabel: "Start writing",
    riffUrl,
  });
}

export async function sendRememberToWriteEmail({
  email,
  ...params
}: RotatingReminderEmailParams & { email: string }): Promise<boolean> {
  try {
    const { subject, html } = buildRememberToWriteEmail(params);
    const { error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM || "Riff <noreply@localhost>",
      to: email,
      subject,
      html,
    });
    if (error) {
      console.error("Resend error (rememberToWrite):", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error sending remember to write email:", error);
    return false;
  }
}

export function buildJoinRiffNudgeEmail({
  riffTitle,
  clubName,
  riffUrl,
  variantIndex,
}: RotatingReminderEmailParams): BuiltEmail {
  return buildReminderEmail({
    variant: JOIN_RIFF_NUDGE_VARIANTS[
      variantIndex % JOIN_RIFF_NUDGE_VARIANTS.length
    ](clubName, riffTitle),
    clubName,
    footerText: `You're receiving this because you're a member of ${clubName} on Riff.`,
    buttonLabel: "Let's riff",
    riffUrl,
  });
}

export async function sendJoinRiffNudgeEmail({
  email,
  ...params
}: RotatingReminderEmailParams & { email: string }): Promise<boolean> {
  try {
    const { subject, html } = buildJoinRiffNudgeEmail(params);
    const { error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM || "Riff <noreply@localhost>",
      to: email,
      subject,
      html,
    });
    if (error) {
      console.error("Resend error (joinRiffNudge):", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error sending join riff nudge email:", error);
    return false;
  }
}

interface ClubPausedEmailParams {
  clubName: string;
  clubUrl: string;
  daysQuiet: number;
  volumeLabel: string;
}

/**
 * Club auto-paused email — sent to the host when the cadence cron gives up on a
 * club that hasn't submitted anything for several deadlines running.
 *
 * Says what happened to the riff as well as to the club. The host didn't ask for
 * that deletion, so this email is where they find out, and it shouldn't mention
 * only the half that sounds better.
 */
export function buildClubPausedEmail({
  clubName,
  clubUrl,
  daysQuiet,
  volumeLabel,
}: ClubPausedEmailParams): BuiltEmail {
  return {
    subject: `${clubName} is paused`,
    html: emailShell({
      title: `${clubName} is paused`,
      clubName,
      footerText: `You're receiving this because you host ${clubName} on Riff.`,
      content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">Taking a breather.</h1>
              <p style="margin:0 0 12px 0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">Nobody's submitted to <strong style="font-weight:500;">${clubName}</strong> in ${daysQuiet} days, so we've paused it and cleared ${volumeLabel}.</p>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">Nothing was lost — anything anyone started is back in their drafts. Pick a cadence whenever the club's ready and a fresh riff opens the next day.</p>
            </td>
          </tr>

          ${emailButton("Set a cadence", clubUrl)}`,
    }),
  };
}

export async function sendClubPausedEmail({
  email,
  ...params
}: ClubPausedEmailParams & { email: string }): Promise<void> {
  try {
    const { subject, html } = buildClubPausedEmail(params);
    const { data, error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM || "Riff <noreply@localhost>",
      to: email,
      subject,
      html,
    });
    if (error) {
      console.error("[email error] club paused:", error);
      throw error;
    }
    console.info(`[email] club paused sent to ${email}`, data?.id);
  } catch (err) {
    console.error("[email error] club paused threw:", err);
    throw err;
  }
}

interface CoHostAssignedEmailParams {
  coHostName: string;
  adminName: string;
  clubName: string;
  clubUrl: string;
}

export function buildCoHostAssignedEmail({
  adminName,
  clubName,
  clubUrl,
}: CoHostAssignedEmailParams): BuiltEmail {
  return {
    subject: `You're a co-host of ${clubName}`,
    html: emailShell({
      title: `You're a co-host of ${clubName}`,
      clubName,
      footerText: `You're receiving this because you're a member of ${clubName} on Riff.`,
      content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">You're a co-host.</h1>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;"><strong style="font-weight:500;">${adminName}</strong> made you a co-host of <strong style="font-weight:500;">${clubName}</strong>. You can now start riffs, reveal pieces, and edit club details.</p>
            </td>
          </tr>

          ${emailButton("Visit club", clubUrl)}`,
    }),
  };
}

export async function sendCoHostAssignedEmail({
  email,
  ...params
}: CoHostAssignedEmailParams & { email: string }): Promise<void> {
  try {
    const { subject, html } = buildCoHostAssignedEmail(params);
    const { error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM || "Riff <noreply@localhost>",
      to: email,
      subject,
      html,
    });
    if (error) console.error("Resend error (coHostAssigned):", error);
  } catch (error) {
    console.error("Error sending co-host assigned email:", error);
  }
}

interface HostTransferredEmailParams {
  oldHostName: string;
  newHostName: string;
  clubName: string;
  clubUrl: string;
}

export function buildHostTransferredEmail({
  oldHostName,
  newHostName,
  clubName,
  clubUrl,
}: HostTransferredEmailParams): BuiltEmail {
  return {
    subject: `New host in ${clubName}`,
    html: emailShell({
      title: `New host in ${clubName}`,
      clubName,
      footerText: `You're receiving this because you're a member of ${clubName} on Riff.`,
      content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">New club host.</h1>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;"><strong style="font-weight:500;">${oldHostName}</strong> has transferred host privileges to <strong style="font-weight:500;">${newHostName}</strong>.</p>
            </td>
          </tr>

          ${emailButton("Visit club", clubUrl)}`,
    }),
  };
}

export async function sendHostTransferredEmail({
  email,
  ...params
}: HostTransferredEmailParams & { email: string }): Promise<void> {
  try {
    const { subject, html } = buildHostTransferredEmail(params);
    const { error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM || "Riff <noreply@localhost>",
      to: email,
      subject,
      html,
    });
    if (error) console.error("Resend error (hostTransferred):", error);
  } catch (error) {
    console.error("Error sending host transferred email:", error);
  }
}

interface CommentNotificationEmailParams {
  pieceTitle: string;
  commentCount: number;
  replyCount: number;
  pieceUrl: string;
}

// One digest per recipient per piece, covering both kinds of activity:
// comments left on a piece you wrote, and replies in a thread you're part of
// (which may be on someone else's piece). Either count can be zero, but the
// caller never sends when both are.
export function buildCommentNotificationEmail({
  pieceTitle,
  commentCount,
  replyCount,
  pieceUrl,
}: CommentNotificationEmailParams): BuiltEmail {
  const parts = [
    commentCount > 0 &&
      `${commentCount} new comment${commentCount === 1 ? "" : "s"} on your piece`,
    replyCount > 0 &&
      `${replyCount} new ${replyCount === 1 ? "reply" : "replies"} to your comments`,
  ].filter((part): part is string => Boolean(part));

  const headline =
    replyCount > 0 && commentCount === 0 ? "New replies" : "New comments";
  const subject = `${headline} on "${pieceTitle}"`;
  const footerText =
    commentCount > 0
      ? `You're receiving this because someone commented on your writing on Riff.`
      : `You're receiving this because you're part of the conversation on Riff.`;

  return {
    subject,
    html: emailShell({
      title: subject,
      footerText,
      content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">${headline} on "${pieceTitle}".</h1>
              <p style="margin:0 0 16px 0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">${parts.join(" and ")} in the last 24 hours.</p>
            </td>
          </tr>

          ${emailButton("View the conversation", pieceUrl)}`,
    }),
  };
}

export async function sendCommentNotificationEmail({
  email,
  ...params
}: CommentNotificationEmailParams & { email: string }): Promise<void> {
  try {
    const { subject, html } = buildCommentNotificationEmail(params);
    const { error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM || "Riff <noreply@localhost>",
      to: email,
      subject,
      html,
    });
    if (error) console.error("Resend error (commentNotification):", error);
  } catch (error) {
    console.error("Error sending comment notification email:", error);
  }
}
