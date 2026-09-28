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

// Gates the recurring riff reminders (sendRiffReminderEmail) on the "Reminders"
// toggle — repurposes the previously unused emailMarketing column so these can
// be silenced independently of the one-time alerts gated by emailNotifications.
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

// Every date an email shows is formatted in Pacific time. Emails render on the
// server, which runs in UTC, and a host-picked deadline is stored as the end of
// that day in the host's own timezone — for Pacific, 06:59 UTC the next day. So
// without a fixed zone, a deadline set for Sunday read as Monday in every email.
// Per-recipient zones would need a stored timezone per user; until then Pacific
// matches the team and what the date picker effectively assumes.
const EMAIL_TIME_ZONE = "America/Los_Angeles";

function formatEmailDate(
  date: Date,
  options: Intl.DateTimeFormatOptions
): string {
  return date.toLocaleDateString("en-US", {
    ...options,
    timeZone: EMAIL_TIME_ZONE,
  });
}

// Whole calendar days from one date to another as the email reader sees them
// (in EMAIL_TIME_ZONE), so an end-of-day deadline moved to the next end of day
// counts as one day, not 0.99.
function calendarDaysBetween(from: Date, to: Date): number {
  const dayNumber = (d: Date) => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: EMAIL_TIME_ZONE,
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).formatToParts(d);
    const part = (type: string) =>
      Number(parts.find((p) => p.type === type)?.value);
    return Date.UTC(part("year"), part("month") - 1, part("day")) / 86_400_000;
  };
  return dayNumber(to) - dayNumber(from);
}

// A piece's title as something worth quoting — null for a blank one or the
// "Untitled" every new draft starts with, so emails fall back to "your draft"
// or "a piece" rather than quoting a placeholder.
function pieceTitleOrNull(title: string | null | undefined): string | null {
  const t = title?.trim();
  return t && t !== "Untitled" ? t : null;
}

// For text people typed — a prompt can contain <, > or &, and must render as
// text rather than as markup in someone else's inbox.
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ==================== SEND FUNCTIONS ====================

export function buildSignInEmail(magicLink: string): BuiltEmail {
  return {
    subject: "Sign in to Riff",
    preview: SIGN_IN_PREVIEW,
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
    preview: WELCOME_PREVIEW,
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
  clubName: string;
  riffUrl: string;
  // What the club page calls it: the host's title, or "Volume N" when there
  // isn't one — which is always the case for riffs the cadence cron opens.
  riffName: string;
  // Optional — hosts often leave it blank, and cron-opened riffs never have one.
  prompt?: string | null;
  // Every riff has one — creation and editing both require it — but the type
  // allows null, and a missing line reads better than an invented date.
  deadline: Date | null;
}

export function buildRiffCreatedEmail(
  params: RiffCreatedEmailParams
): BuiltEmail {
  const preview = params.deadline
    ? `${params.riffName} is open. Due ${formatEmailDate(params.deadline, {
        weekday: "long",
        month: "short",
        day: "numeric",
      })}.`
    : `${params.riffName} is open.`;
  return {
    subject: `New riff in ${params.clubName}`,
    preview,
    html: getRiffCreatedEmailTemplate({ ...params, preview }),
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
  // Null for an open (clubless) riff.
  clubName: string | null;
  riffUrl: string;
  riffTitle?: string | null;
  volumeNumber?: number | null;
  // Submitted pieces only — attached drafts that never went in don't count.
  pieceCount: number;
}

function revealedDisplayTitle({
  riffTitle,
  volumeNumber,
}: Pick<RiffRevealedEmailParams, "riffTitle" | "volumeNumber">): string | null {
  return volumeNumber
    ? riffTitle
      ? `Volume ${volumeNumber}: ${riffTitle}`
      : `Volume ${volumeNumber}`
    : riffTitle || null;
}

function piecesReady(count: number): string {
  return count === 1
    ? "1 piece is ready to read"
    : `${count} pieces are ready to read`;
}

export function buildRiffRevealedEmail(
  params: RiffRevealedEmailParams
): BuiltEmail {
  const displayTitle = revealedDisplayTitle(params);
  return {
    subject: params.clubName
      ? `Riff revealed in ${params.clubName}`
      : `${displayTitle ?? "Your riff"} is revealed`,
    preview: `${piecesReady(params.pieceCount)}.`,
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

const SIGN_IN_PREVIEW =
  "Your link is ready. It works once and expires in 24 hours.";

/**
 * Sign-in email (auth layout — big logo at top)
 */
function getSignInEmailTemplate(magicLink: string): string {
  return emailShell({
    title: "Sign in to Riff",
    preview: SIGN_IN_PREVIEW,
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

const WELCOME_PREVIEW = "One tap and you're in. Your link expires in 24 hours.";

/**
 * Onboarding email for new users (auth layout — big logo at top)
 */
function getOnboardingEmailTemplate(magicLink: string): string {
  return emailShell({
    title: "Welcome to Riff",
    preview: WELCOME_PREVIEW,
    unsubscribe: false,
    footerText: `Button not working? Copy this link into your browser:<br><a href="${magicLink}" style="color:#888888;font-size:11px;word-break:break-all;">${magicLink}</a>`,
    content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">Welcome to Riff.</h1>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">Tap below to finish signing up.</p>
            </td>
          </tr>

          ${emailButton("Let's riff", magicLink)}

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
  clubName,
  riffUrl,
  riffName,
  prompt,
  deadline,
  preview,
}: RiffCreatedEmailParams & { preview: string }): string {
  // Name in the headline, then the due date, then the prompt when there is
  // one — so a riff without a prompt just ends a line sooner.
  const dueLine = deadline
    ? `<p style="margin:0;font-size:16px;font-weight:500;color:#000000;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">Due ${formatEmailDate(
        deadline,
        { weekday: "long", month: "long", day: "numeric" }
      )}</p>`
    : "";
  const promptLine = prompt?.trim()
    ? `<p style="margin:${deadline ? "12px" : "0"} 0 0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">${escapeHtml(prompt.trim()).replace(/\n/g, "<br>")}</p>`
    : "";

  return emailShell({
    title: `New riff in ${clubName}`,
    preview,
    clubName,
    footerText: `You're receiving this because you're a member of ${clubName} on Riff.`,
    content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">New riff dropped: ${escapeHtml(riffName)}</h1>
              ${dueLine}
              ${promptLine}
            </td>
          </tr>

          ${emailButton("Let's riff", riffUrl)}`,
  });
}

/**
 * Riff revealed email (notification layout — club name at top)
 */
function getRiffRevealedEmailTemplate(params: RiffRevealedEmailParams): string {
  const { clubName, riffUrl, pieceCount, riffTitle, volumeNumber } = params;
  const displayTitle = revealedDisplayTitle(params);
  // Mirrors "New riff dropped: …". A dot rather than the usual colon between
  // volume and title, so the headline doesn't carry two colons.
  const headlineTitle =
    volumeNumber && riffTitle
      ? `Volume ${volumeNumber} · ${riffTitle}`
      : displayTitle;
  const headline = headlineTitle
    ? `Riff revealed: ${escapeHtml(headlineTitle)}`
    : "Riff revealed.";
  // An open riff has no club, so its own name heads the email instead.
  const header = clubName ?? displayTitle ?? "Riff";

  return emailShell({
    title: clubName
      ? `Riff revealed in ${clubName}`
      : `${displayTitle ?? "Your riff"} is revealed`,
    preview: `${piecesReady(pieceCount)}.`,
    clubName: header,
    footerText: clubName
      ? `You're receiving this because you're a member of ${clubName} on Riff.`
      : `You're receiving this because you're part of ${header} on Riff.`,
    content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">${headline}</h1>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">${piecesReady(pieceCount)}.</p>
            </td>
          </tr>

          ${emailButton("Read pieces", riffUrl)}`,
  });
}

// ==================== NOTIFICATION EMAILS ====================

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
  // The title, or "Volume N" for an untitled club riff — what the club page shows.
  riffName: string;
  // Null for an open (clubless) riff.
  clubName: string | null;
  riffUrl: string;
  // Progress after this submission: pieces in, out of everyone who could write
  // one (club members, or an open riff's participants).
  submittedCount: number;
  writerCount: number;
  // Already visible pre-reveal on the club page's locked cards, so naming it
  // here reveals nothing new.
  pieceTitle?: string | null;
  deadline: Date | null;
}

// "with 3 days to go" / "due today" — left out once the deadline has passed,
// e.g. a late submission during the grace week.
function timeLeft(deadline: Date | null): string {
  if (!deadline) return "";
  const days = calendarDaysBetween(new Date(), deadline);
  if (days < 0) return "";
  if (days === 0) return ", due today";
  return `, with ${days === 1 ? "1 day" : `${days} days`} to go`;
}

export function buildPieceSubmittedEmail({
  actorName,
  riffName,
  clubName,
  riffUrl,
  submittedCount,
  writerCount,
  pieceTitle,
  deadline,
}: PieceSubmittedEmailParams): BuiltEmail {
  const headline = pieceTitle?.trim()
    ? `${escapeHtml(actorName)} submitted &ldquo;${escapeHtml(pieceTitle.trim())}&rdquo;`
    : `${escapeHtml(actorName)} submitted a piece.`;
  const progress = `${submittedCount} of ${Math.max(writerCount, submittedCount)}`;
  const preview = `${progress} pieces are in.`;
  const header = clubName ?? riffName;

  return {
    subject: `${actorName} submitted to ${riffName}`,
    preview,
    html: emailShell({
      title: `${actorName} submitted to ${riffName}`,
      preview,
      clubName: header,
      footerText: clubName
        ? `You're receiving this because you're a member of ${clubName} on Riff.`
        : `You're receiving this because you're part of ${riffName} on Riff.`,
      content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">${headline}</h1>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">That's ${progress} pieces in for <strong style="font-weight:500;">${escapeHtml(riffName)}</strong>${timeLeft(deadline)}. Everyone's pieces unlock at the reveal.</p>
            </td>
          </tr>

          ${emailButton("View the riff", riffUrl)}`,
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
  const longDate = formatEmailDate(newDeadline, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const preview = `Now due ${formatEmailDate(newDeadline, {
    weekday: "long",
    month: "short",
    day: "numeric",
  })}.`;
  return {
    subject: `One more week for ${clubName}`,
    preview,
    html: emailShell({
      title: `One more week for ${clubName}`,
      preview,
      clubName,
      footerText: `You're receiving this because you're a member of ${clubName} on Riff.`,
      content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">Nobody submitted anything this round.</h1>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">We've extended the deadline a week, to <strong style="font-weight:500;">${longDate}</strong>. One piece keeps the club going. If nothing comes in, we'll assume the club's taking a break.</p>
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
  // Null for an open (clubless) riff.
  clubName: string | null;
  // The title, or "Volume N" for an untitled club riff — what the club page shows.
  riffName: string;
  riffUrl: string;
  newDeadline: Date;
  previousDeadline: Date | null;
}

function howFarMoved(days: number): string {
  const n = Math.abs(days);
  const amount = n === 1 ? "a day" : n === 7 ? "a week" : `${n} days`;
  return `${amount} ${days > 0 ? "later" : "earlier"}`;
}

// Deliberately actor-free: a deadline moves because the host rescheduled it, and
// the club has no reason to care who. The cadence cron does not use this — its
// one extension is the grace week, which needs to explain itself.
export function buildDeadlineChangedEmail({
  clubName,
  riffName,
  riffUrl,
  newDeadline,
  previousDeadline,
}: DeadlineChangedEmailParams): BuiltEmail {
  const longDate = formatEmailDate(newDeadline, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const shortDate = formatEmailDate(newDeadline, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  // Zero when only the time of day changed — then there's no direction to give.
  const days = previousDeadline
    ? calendarDaysBetween(previousDeadline, newDeadline)
    : 0;
  const header = clubName ?? riffName;

  return {
    subject: `${riffName} has a new deadline`,
    preview: days
      ? `Now due ${shortDate}, ${howFarMoved(days)}.`
      : `Now due ${shortDate}.`,
    html: emailShell({
      title: `${riffName} has a new deadline`,
      preview: days
        ? `Now due ${shortDate}, ${howFarMoved(days)}.`
        : `Now due ${shortDate}.`,
      clubName: header,
      footerText: clubName
        ? `You're receiving this because you're a member of ${clubName} on Riff.`
        : `You're receiving this because you're part of ${riffName} on Riff.`,
      content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">Deadline moved: ${escapeHtml(riffName)}</h1>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">It's now due <strong style="font-weight:500;">${longDate}</strong>${days ? `, ${howFarMoved(days)} than before` : ""}.</p>
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

interface RiffReminderEmailParams {
  // Null for an open (clubless) riff.
  clubName: string | null;
  // The title, or "Volume N" for an untitled club riff — what the club page shows.
  riffName: string;
  riffUrl: string;
  deadline: Date;
  // Which of the riff's two reminders this is. A missed halfway run catches up
  // as the final call, so a person never gets a halfway nudge after it.
  milestone: "halfway" | "final";
  // The recipient's own draft on this riff, if they've attached one. With words
  // in it they get "you're N words into…"; the button goes straight to it
  // either way, matching the club page's "Continue writing".
  draft: { url: string; title: string | null; wordCount: number } | null;
}

// One reminder for every unsubmitted writer. It replaced three templates —
// deadline-approaching, remember-to-write and join-riff-nudge — which rotated
// jokes by send count. Its whole job is to get someone back into their draft:
// when it's due, and one tap to get there. Who else has submitted is left out
// on purpose — every submission already emails the club.
export function buildRiffReminderEmail({
  clubName,
  riffName,
  riffUrl,
  deadline,
  milestone,
  draft,
}: RiffReminderEmailParams): BuiltEmail {
  const days = Math.max(calendarDaysBetween(new Date(), deadline), 0);
  const dueIn =
    days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
  const dueDate = `<strong style="font-weight:500;">${formatEmailDate(
    deadline,
    { weekday: "long", month: "long", day: "numeric" }
  )}</strong>`;
  const draftTitle = pieceTitleOrNull(draft?.title);
  const draftName = draftTitle
    ? `&ldquo;${escapeHtml(draftTitle)}&rdquo;`
    : "your draft";

  // Each body pairs where the reader is (started or not) with where the riff
  // is (its date at halfway, the last day at the final call). An empty attached
  // draft reads as not started, though its button still opens that draft.
  const when =
    milestone === "final"
      ? `${days === 0 ? "Today" : "Tomorrow"}'s the last day to submit.`
      : `It's due ${dueDate}.`;
  const body =
    draft && draft.wordCount > 0
      ? `You're ${draft.wordCount.toLocaleString("en-US")} words into ${draftName}. ${when}`
      : `${when} There's still time to write something.`;

  const headline =
    milestone === "final"
      ? `Last call: ${escapeHtml(riffName)}`
      : `Halfway there: ${escapeHtml(riffName)}`;
  const buttonLabel = draft ? "Continue writing" : "Start writing";
  // The preview is the button's own words — the one thing to do.
  const preview = `${buttonLabel}.`;
  const header = clubName ?? riffName;

  return {
    subject: `${riffName} is due ${dueIn}`,
    preview,
    html: emailShell({
      title: `${riffName} is due ${dueIn}`,
      preview,
      clubName: header,
      footerText: `You're receiving this because you haven't submitted to ${riffName} yet.`,
      content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">${headline}</h1>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">${body}</p>
            </td>
          </tr>

          ${emailButton(buttonLabel, draft?.url ?? riffUrl)}`,
    }),
  };
}

export async function sendRiffReminderEmail({
  email,
  ...params
}: RiffReminderEmailParams & { email: string }): Promise<boolean> {
  try {
    const { subject, html } = buildRiffReminderEmail(params);
    const { error } = await getResend().emails.send({
      from: process.env.EMAIL_FROM || "Riff <noreply@localhost>",
      to: email,
      subject,
      html,
    });
    if (error) {
      console.error("Resend error (riffReminder):", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error sending riff reminder email:", error);
    return false;
  }
}

interface ClubPausedEmailParams {
  clubName: string;
  clubUrl: string;
  // The riff that was cleared — its title, or the "Volume N" it would have been.
  riffName: string;
}

/**
 * Club auto-paused email — sent to the host when the cadence cron pauses a club
 * whose riff stayed empty through its grace week.
 *
 * The empty riff is deleted along with the pause; the email leaves that out on
 * purpose — nothing was submitted to it, and the club page no longer shows it.
 */
export function buildClubPausedEmail({
  clubName,
  clubUrl,
  riffName,
}: ClubPausedEmailParams): BuiltEmail {
  const preview = "Start again whenever you're ready.";
  return {
    subject: `${clubName} is paused`,
    preview,
    html: emailShell({
      title: `${clubName} is paused`,
      preview,
      clubName,
      footerText: `You're receiving this because you host ${clubName} on Riff.`,
      content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">Taking a breather.</h1>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">Nothing was submitted to <strong style="font-weight:500;">${escapeHtml(riffName)}</strong>, so we've paused the club. Pick things back up whenever you're ready.</p>
            </td>
          </tr>

          ${emailButton("Visit club", clubUrl)}`,
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
