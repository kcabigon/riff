/**
 * Resend email service integration
 * Handles sending magic link emails and notification emails with custom branding
 */

import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/env";
import { buildEmailExcerpt } from "@/lib/email-excerpt";
import { escapeHtml } from "@/lib/html";

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

// Gates the recurring riff and reading reminders on the "Reminders"
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
// Previews are plain text, and some carry what people typed (names, or a
// shared piece's opening), so it's escaped here, once, for every email.
function preheader(text: string): string {
  return `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#ffffff;">${escapeHtml(text)}${"&#847;&zwnj;&nbsp;".repeat(60)}</div>`;
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
  footerLink,
  clubName,
  unsubscribe = true,
  preview,
  showLogo = true,
}: {
  title: string;
  content: string;
  // Plain text — escaped here, because it names clubs, riffs and people.
  // title, clubName and preview are plain text too, escaped the same way, so
  // no template has to remember to.
  footerText: string;
  // A URL shown in full under the footer text, for "button not working?".
  footerLink?: string;
  clubName?: string;
  unsubscribe?: boolean;
  preview?: string;
  // Off for an email whose content is its own header — the shared piece, which
  // opens on the piece's cover and title. The wordmark then moves to the small
  // footer logo that notification emails use.
  showLogo?: boolean;
}): string {
  const baseUrl = getBaseUrl();
  const footerBody = footerLink
    ? `${escapeHtml(footerText)}<br><a href="${footerLink}" style="color:#888888;font-size:11px;word-break:break-all;">${escapeHtml(footerLink)}</a>`
    : escapeHtml(footerText);
  const fullFooterText = unsubscribe
    ? `${footerBody} · <a href="${baseUrl}/account" style="color:#bbbbbb;">Unsubscribe</a>`
    : footerBody;
  const topSection = clubName
    ? `<!-- Club name header -->
          <tr>
            <td style="padding:40px 40px 24px;">
              <p style="margin:0;font-size:16px;font-weight:500;color:#000000;letter-spacing:2px;text-transform:uppercase;font-family:'DM Sans',-apple-system,sans-serif;">${escapeHtml(clubName)}</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="height:2px;background-color:#000000;font-size:0;line-height:0;">&nbsp;</td></tr></table>
            </td>
          </tr>`
    : !showLogo
      ? ""
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

  const smallFooterLogo = Boolean(clubName) || !showLogo;
  const bottomLogo = smallFooterLogo
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
  <title>${escapeHtml(title)}</title>
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
            <td style="padding:20px 40px ${smallFooterLogo ? "12px" : "32px"};border-top:1px solid #eeeeee;">
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
                    <a href="${href}" style="display:block;font-size:17px;font-weight:300;color:#000000;text-decoration:none;font-family:'DM Sans',-apple-system,sans-serif;">${escapeHtml(label)}</a>
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

// A finished piece's title — submitted, published or revealed — is exactly
// what the author called it, "Untitled" included; a blank one reads as
// "Untitled", as it does in the app.
function finishedPieceTitle(title: string | null | undefined): string {
  return title?.trim() || "Untitled";
}

// A draft's title, or null while it still carries the "Untitled" every new
// draft starts with — the writer hasn't chosen one yet, so emails say "your
// draft" instead.
function draftTitleOrNull(title: string | null | undefined): string | null {
  const t = title?.trim();
  return t && t !== "Untitled" ? t : null;
}

// One email on its way to one person.
export interface OutgoingEmail {
  to: string;
  email: BuiltEmail;
}

function toResendPayload({ to, email }: OutgoingEmail) {
  return {
    from: process.env.EMAIL_FROM || "Riff <noreply@localhost>",
    to,
    subject: email.subject,
    html: email.html,
  };
}

// Resend turns away requests over its per-second limit rather than queueing
// them, and the daily cron runs its jobs side by side, so two sends colliding
// is ordinary. A rate-limited request waits and tries again, backing off a
// little more each time, before it counts as failed.
const RATE_LIMIT_RETRIES = 3;

async function withRateLimitRetry<T extends { error: { name: string } | null }>(
  request: () => Promise<T>
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    const response = await request();
    if (
      response.error?.name !== "rate_limit_exceeded" ||
      attempt > RATE_LIMIT_RETRIES
    ) {
      return response;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
  }
}

// Sends a built email. Never throws: failures are logged with the email's
// label and reported as false, and each send function decides what a failure
// means for its caller — the sign-in email, for one, must throw.
async function deliver(
  to: string,
  email: BuiltEmail,
  label: string
): Promise<boolean> {
  try {
    const { error } = await withRateLimitRetry(() =>
      getResend().emails.send(toResendPayload({ to, email }))
    );
    if (error) {
      console.error(`[email error] ${label}:`, error);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[email error] ${label} threw:`, err);
    return false;
  }
}

// Resend's batch endpoint takes up to 100 emails a request.
const BATCH_SIZE = 100;

// A batch is accepted or rejected whole. These rejections mean something in
// it was malformed — one bad address, or in development an address the test
// key may not send to — so the rest still deserve to go out, one by one.
// Anything else (an outage, a bad key) would fail singly too.
const PER_EMAIL_REJECTIONS = new Set([
  "validation_error",
  "invalid_parameter",
  "missing_required_field",
]);

// Sends many emails in as few requests as possible — how anything that mails
// more than one person should send. Never throws; returns, in order, whether
// each email went out, so a caller that keeps a send log (the reminders) can
// log exactly the ones that did.
export async function deliverMany(
  messages: OutgoingEmail[],
  label: string
): Promise<boolean[]> {
  const delivered: boolean[] = [];
  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const chunk = messages.slice(i, i + BATCH_SIZE);
    try {
      const { error } = await withRateLimitRetry(() =>
        getResend().batch.send(chunk.map(toResendPayload))
      );
      if (!error) {
        delivered.push(...chunk.map(() => true));
      } else if (PER_EMAIL_REJECTIONS.has(error.name)) {
        console.error(
          `[email error] ${label} batch rejected, sending one by one:`,
          error
        );
        for (const message of chunk) {
          delivered.push(await deliver(message.to, message.email, label));
        }
      } else {
        console.error(`[email error] ${label} batch:`, error);
        delivered.push(...chunk.map(() => false));
      }
    } catch (err) {
      console.error(`[email error] ${label} batch threw:`, err);
      delivered.push(...chunk.map(() => false));
    }
  }
  return delivered;
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
  // Throws on failure — its caller counts or reports failed sends.
  if (!(await deliver(email, buildSignInEmail(magicLink), "signIn"))) {
    throw new Error("Failed to send signIn email");
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
  // Throws on failure — its caller counts or reports failed sends.
  if (!(await deliver(email, buildOnboardingEmail(magicLink), "onboarding"))) {
    throw new Error("Failed to send onboarding email");
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

// A list of pieces to read — title, author, read time — shared by the three
// emails that bookend a reveal: riff revealed, then the two reading reminders.
// Only the first few are listed; the rest are counted.
export interface ReadingListPiece {
  title: string;
  authorName: string;
  readLengthMin: number;
}

const READING_LIST_MAX = 5;

function readingListHtml(pieces: ReadingListPiece[]): string {
  const listed = pieces.slice(0, READING_LIST_MAX);
  const more = pieces.length - listed.length;
  const rows = listed.map(
    (p) =>
      `<p style="margin:12px 0 0;font-size:16px;font-weight:300;color:#444444;line-height:1.5;font-family:'DM Sans',-apple-system,sans-serif;"><strong style="font-weight:500;color:#000000;">${escapeHtml(finishedPieceTitle(p.title))}</strong> by ${escapeHtml(p.authorName)} &middot; ${Math.max(p.readLengthMin, 1)} min</p>`
  );
  if (more > 0) {
    rows.push(
      `<p style="margin:12px 0 0;font-size:16px;font-weight:300;color:#808080;line-height:1.5;font-family:'DM Sans',-apple-system,sans-serif;">and ${more} more</p>`
    );
  }
  return rows.join("\n              ");
}

interface RiffRevealedEmailParams {
  // Null for an open (clubless) riff.
  clubName: string | null;
  riffUrl: string;
  // As the app names it — getRiffDisplayTitle, e.g. "Volume 6: Summer Stories".
  riffName: string;
  // What this reader has to read: every submitted piece except their own.
  // Attached drafts that never went in aren't pieces anyone can read.
  pieces: ReadingListPiece[];
}

// Riff names follow the app ("Volume 6: Summer Stories") everywhere but one
// spot: straight after a headline's own "Label:", where a second colon would
// stutter — "Riff revealed: Volume 6 · Summer Stories".
function afterLabel(riffName: string): string {
  return riffName.replace(/^(Volume \d+): /, "$1 · ");
}

// "3 pieces are ready to read." — or, for the round's only writer, a line
// that doesn't pretend there's something waiting.
function piecesReady(count: number): string {
  if (count === 0) return "Yours is the only piece this round.";
  return count === 1
    ? "1 piece is ready to read."
    : `${count} pieces are ready to read.`;
}

export function buildRiffRevealedEmail(
  params: RiffRevealedEmailParams
): BuiltEmail {
  return {
    // Riff-named, like the two reading reminders that follow it.
    subject: `${params.riffName} is revealed`,
    preview: piecesReady(params.pieces.length),
    html: getRiffRevealedEmailTemplate(params),
  };
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
    footerText: "Button not working? Copy this link into your browser:",
    footerLink: magicLink,
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
    footerText: "Button not working? Copy this link into your browser:",
    footerLink: magicLink,
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
  const { clubName, riffUrl, pieces, riffName } = params;
  const headline = `Riff revealed: ${escapeHtml(afterLabel(riffName))}`;
  // An open riff has no club, so its own name heads the email instead.
  const header = clubName ?? riffName;

  return emailShell({
    title: `${riffName} is revealed`,
    preview: piecesReady(pieces.length),
    clubName: header,
    footerText: clubName
      ? `You're receiving this because you're a member of ${clubName} on Riff.`
      : `You're receiving this because you're part of ${header} on Riff.`,
    content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">${headline}</h1>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">${piecesReady(pieces.length)}</p>
              ${readingListHtml(pieces)}
            </td>
          </tr>

          ${emailButton(pieces.length > 0 ? "Read pieces" : "View the riff", riffUrl)}`,
  });
}

// ==================== NOTIFICATION EMAILS ====================

interface MemberJoinedEmailParams {
  newMemberFullName: string;
  newMemberFirstName: string;
  clubName: string;
  clubUrl: string;
  // Members including the one who just joined.
  memberCount: number;
}

export function buildMemberJoinedEmail({
  newMemberFullName,
  clubName,
  clubUrl,
  memberCount,
}: MemberJoinedEmailParams): BuiltEmail {
  const preview = `That makes ${memberCount} of you.`;
  return {
    subject: `${newMemberFullName} joined ${clubName}`,
    preview,
    html: emailShell({
      title: `${newMemberFullName} joined ${clubName}`,
      preview,
      clubName,
      footerText: `You're receiving this because you're a member of ${clubName} on Riff.`,
      content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">${escapeHtml(newMemberFullName)} just joined ${escapeHtml(clubName)}.</h1>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">That makes ${memberCount} of you.</p>
            </td>
          </tr>

          ${emailButton("View the club", clubUrl)}`,
    }),
  };
}

interface ParticipantJoinedEmailParams {
  newParticipantFullName: string;
  riffName: string;
  riffUrl: string;
  // Participants including the one who just joined.
  participantCount: number;
}

// The open-riff counterpart to member-joined, sent to the riff's creator only
// (see notifyOpenRiffParticipantJoined).
export function buildParticipantJoinedEmail({
  newParticipantFullName,
  riffName,
  riffUrl,
  participantCount,
}: ParticipantJoinedEmailParams): BuiltEmail {
  const writers = `${riffName} now has ${participantCount} writer${
    participantCount === 1 ? "" : "s"
  }.`;
  const preview = writers;
  return {
    subject: `${newParticipantFullName} joined ${riffName}`,
    preview,
    html: emailShell({
      title: `${newParticipantFullName} joined ${riffName}`,
      preview,
      clubName: riffName,
      footerText: `You're receiving this because you started ${riffName} on Riff.`,
      content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">${escapeHtml(newParticipantFullName)} just joined ${escapeHtml(riffName)}.</h1>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">${escapeHtml(writers)}</p>
            </td>
          </tr>

          ${emailButton("View the riff", riffUrl)}`,
    }),
  };
}

export async function sendParticipantJoinedEmail({
  email,
  ...params
}: ParticipantJoinedEmailParams & { email: string }): Promise<void> {
  await deliver(
    email,
    buildParticipantJoinedEmail(params),
    "participantJoined"
  );
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
  const headline = `${escapeHtml(actorName)} submitted &ldquo;${escapeHtml(finishedPieceTitle(pieceTitle))}&rdquo;.`;
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

interface PieceSharedEmailParams {
  // First name, for the "shared this with you" line and the subject.
  actorName: string;
  // Full name, for the byline.
  authorName: string;
  pieceTitle: string | null;
  subtitle?: string | null;
  coverImage?: string | null;
  // The piece's HTML, as stored. Only its opening reaches the email — see
  // buildEmailExcerpt.
  content: string;
  readLengthMin: number;
  pieceUrl: string;
}

// Send section of the Share modal — the author picked this friend, who already
// has access, so the email is laid out as the start of the piece rather than
// an alert about it: cover, title, byline, then the opening lines. The subject
// and footer carry who shared it.
//
// The excerpt is a few sentences of the author's writing that stays in the
// inbox even if the piece later changes — sent only to people the author chose.
export function buildPieceSharedEmail({
  actorName,
  authorName,
  pieceTitle,
  subtitle,
  coverImage,
  content,
  readLengthMin,
  pieceUrl,
}: PieceSharedEmailParams): BuiltEmail {
  // Roughly the first two paragraphs — enough to get pulled in.
  const excerpt = buildEmailExcerpt(content, 600);
  const title = finishedPieceTitle(pieceTitle);
  const readLength = `${Math.max(readLengthMin, 1)} min read`;
  // The inbox line is the opening sentence or so, cut at a word — starting at
  // the first real paragraph, past a short heading like "Chapter 1".
  const firstParagraph =
    excerpt.paragraphs.find((p) => p.length > 40) ??
    excerpt.paragraphs[0] ??
    "";
  const opening =
    firstParagraph.length > 110
      ? `${firstParagraph.slice(0, firstParagraph.lastIndexOf(" ", 110)).replace(/[,;:.…\s]+$/, "")}…`
      : firstParagraph;
  const preview = opening || `A ${readLength}.`;

  const cover = coverImage
    ? `
          <tr>
            <td style="padding:40px 40px 0;">
              <a href="${pieceUrl}"><img src="${escapeHtml(coverImage)}" alt="" width="436" style="display:block;width:100%;height:auto;border:2px solid #000000;" /></a>
            </td>
          </tr>`
    : "";
  const subtitleLine = subtitle?.trim()
    ? `<p style="margin:8px 0 0;font-size:18px;font-weight:400;color:#808080;line-height:1.4;font-family:'DM Serif Text',Georgia,serif;">${escapeHtml(subtitle.trim())}</p>`
    : "";
  // Already escaped and reduced to paragraphs, breaks, bold and italic.
  const excerptBlock = excerpt.html
    .split("\n")
    .map(
      (paragraph, i) =>
        `<p style="margin:${i === 0 ? "24px" : "16px"} 0 0;font-size:17px;font-weight:400;color:#222222;line-height:1.7;font-family:Georgia,'Times New Roman',serif;">${paragraph}</p>`
    )
    .join("\n              ");

  return {
    subject: `${actorName} shared a piece with you`,
    preview,
    html: emailShell({
      title,
      preview,
      footerText: `You're receiving this because ${actorName} shared a piece with you on Riff.`,
      showLogo: false,
      content: `
${cover}
          <tr>
            <td style="padding:${coverImage ? "24px" : "40px"} 40px 0;">
              <h1 style="margin:0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">${escapeHtml(title)}</h1>
              ${subtitleLine}
              <p style="margin:12px 0 0;font-size:13px;font-weight:300;color:#808080;line-height:1.5;font-family:'DM Sans',-apple-system,sans-serif;">${escapeHtml(authorName)} &middot; ${readLength}</p>
              ${excerptBlock}
            </td>
          </tr>

          ${emailButton("Keep reading", pieceUrl)}`,
    }),
  };
}

interface PieceInviteAcceptedEmailParams {
  // First name of whoever accepted.
  accepterName: string;
  pieceTitle: string | null;
  // Home, where the Friends section leads the page and the new friend now
  // appears. Not their profile — someone accepting an invite is usually new,
  // with nothing on it.
  friendsUrl: string;
}

// An author invited someone through a piece's link and they accepted, which
// makes them friends: each can now read what the other publishes. Sent to the
// author only, and only when the friendship is new — the accept route returns
// early for people who were already friends through a club or riff.
export function buildPieceInviteAcceptedEmail({
  accepterName,
  pieceTitle,
  friendsUrl,
}: PieceInviteAcceptedEmailParams): BuiltEmail {
  const title = finishedPieceTitle(pieceTitle);
  const onPiece = ` to \u201c${title}\u201d`;
  const preview = "You're friends now.";
  return {
    subject: `${accepterName} accepted your invite${onPiece}`,
    preview,
    html: emailShell({
      title: `${accepterName} accepted your invite${onPiece}`,
      preview,
      // The piece takes the header slot, as in the comment digest.
      clubName: title,
      footerText: `You're receiving this because you invited ${accepterName} to a piece on Riff.`,
      content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">${escapeHtml(accepterName)} accepted your invite.</h1>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">You're friends now, so ${escapeHtml(accepterName)} can read the pieces you publish, and you can read theirs.</p>
            </td>
          </tr>

          ${emailButton("View your friends", friendsUrl)}`,
    }),
  };
}

export async function sendPieceInviteAcceptedEmail({
  email,
  ...params
}: PieceInviteAcceptedEmailParams & { email: string }): Promise<void> {
  await deliver(
    email,
    buildPieceInviteAcceptedEmail(params),
    "pieceInviteAccepted"
  );
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

          ${emailButton("Start writing", riffUrl)}`,
    }),
  };
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
  const draftTitle = draftTitleOrNull(draft?.title);
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

interface ReadingReminderEmailParams {
  // Null for an open (clubless) riff.
  clubName: string | null;
  // As the app names it — getRiffDisplayTitle, e.g. "Volume 6: Summer Stories".
  riffName: string;
  nudge: "first" | "second";
  // What this reader hasn't read, in submission order — never their own.
  pieces: ReadingListPiece[];
  // The riff page, the same destination as the reveal email.
  riffUrl: string;
}

// The reading nudge after a reveal (see runReadingReminders). It goes to every
// member, including anyone who didn't write this round — reading doesn't
// need you to have written. It lists exactly what's left for this reader, so
// it's a to-do list rather than a guilt trip, and says how long it'll take.
export function buildReadingReminderEmail({
  clubName,
  riffName,
  nudge,
  pieces,
  riffUrl,
}: ReadingReminderEmailParams): BuiltEmail {
  const count = pieces.length;
  const piecesWord = count === 1 ? "1 piece" : `${count} pieces`;
  const minutes = pieces.reduce(
    (sum, p) => sum + Math.max(p.readLengthMin, 1),
    0
  );
  const subject =
    nudge === "first"
      ? `${piecesWord} to read in ${riffName}`
      : `${piecesWord} still waiting in ${riffName}`;
  const preview = `About ${minutes} minute${minutes === 1 ? "" : "s"} of reading.`;
  const headline =
    nudge === "first"
      ? `Ready to read: ${escapeHtml(afterLabel(riffName))}`
      : `Still unread: ${escapeHtml(afterLabel(riffName))}`;
  const intro =
    nudge === "first"
      ? count === 1
        ? "Here's the one you haven't read yet."
        : "Here's what you haven't read yet."
      : count === 1
        ? "One piece is still waiting for you."
        : "A few pieces are still waiting for you.";

  const header = clubName ?? riffName;

  return {
    subject,
    preview,
    html: emailShell({
      title: subject,
      preview,
      clubName: header,
      footerText: clubName
        ? `You're receiving this because you're a member of ${clubName} on Riff.`
        : `You're receiving this because you're part of ${riffName} on Riff.`,
      content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">${headline}</h1>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">${intro}</p>
              ${readingListHtml(pieces)}
            </td>
          </tr>

          ${emailButton("Read pieces", riffUrl)}`,
    }),
  };
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

          ${emailButton("View the club", clubUrl)}`,
    }),
  };
}

export async function sendClubPausedEmail({
  email,
  ...params
}: ClubPausedEmailParams & { email: string }): Promise<void> {
  // Throws on failure — its caller counts or reports failed sends.
  if (!(await deliver(email, buildClubPausedEmail(params), "clubPaused"))) {
    throw new Error("Failed to send clubPaused email");
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
  const preview = `You can now help run ${clubName}.`;
  return {
    subject: `You're a co-host of ${clubName}`,
    preview,
    html: emailShell({
      title: `You're a co-host of ${clubName}`,
      preview,
      clubName,
      footerText: `You're receiving this because you're a member of ${clubName} on Riff.`,
      content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">You're a co-host.</h1>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;"><strong style="font-weight:500;">${escapeHtml(adminName)}</strong> made you a co-host of <strong style="font-weight:500;">${escapeHtml(clubName)}</strong>. You can now start and reveal riffs, set the club's cadence, and edit club details.</p>
            </td>
          </tr>

          ${emailButton("View the club", clubUrl)}`,
    }),
  };
}

export async function sendCoHostAssignedEmail({
  email,
  ...params
}: CoHostAssignedEmailParams & { email: string }): Promise<void> {
  await deliver(email, buildCoHostAssignedEmail(params), "coHostAssigned");
}

interface HostTransferredEmailParams {
  oldHostName: string;
  newHostName: string;
  clubName: string;
  clubUrl: string;
  // The transfer emails both people, and each needs their own side of it —
  // the old host is the one who just clicked the button.
  recipient: "newHost" | "oldHost";
}

export function buildHostTransferredEmail({
  oldHostName,
  newHostName,
  clubName,
  clubUrl,
  recipient,
}: HostTransferredEmailParams): BuiltEmail {
  const copy =
    recipient === "newHost"
      ? {
          subject: `You're now the host of ${clubName}`,
          preview: `${oldHostName} handed ${clubName} over to you.`,
          headline: "You're the host now.",
          body: `<strong style="font-weight:500;">${escapeHtml(oldHostName)}</strong> handed <strong style="font-weight:500;">${escapeHtml(clubName)}</strong> over to you. You can now assign a co-host and manage everything about the club.`,
        }
      : {
          subject: `${newHostName} is now the host of ${clubName}`,
          preview: `You're still in ${clubName} as a member.`,
          headline: "Handed off.",
          body: `<strong style="font-weight:500;">${escapeHtml(newHostName)}</strong> is now the host of <strong style="font-weight:500;">${escapeHtml(clubName)}</strong>. You're still in the club as a member.`,
        };

  return {
    subject: copy.subject,
    preview: copy.preview,
    html: emailShell({
      title: copy.subject,
      preview: copy.preview,
      clubName,
      footerText: `You're receiving this because you're a member of ${clubName} on Riff.`,
      content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">${copy.headline}</h1>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">${copy.body}</p>
            </td>
          </tr>

          ${emailButton("View the club", clubUrl)}`,
    }),
  };
}

export async function sendHostTransferredEmail({
  email,
  ...params
}: HostTransferredEmailParams & { email: string }): Promise<void> {
  await deliver(email, buildHostTransferredEmail(params), "hostTransferred");
}

interface CommentNotificationEmailParams {
  pieceTitle: string;
  commentCount: number;
  replyCount: number;
  // First names of whoever commented or replied, each once, in order.
  actorNames: string[];
  pieceUrl: string;
}

// "Rivy", "Rivy and Johnny", "Rivy, Johnny, and Jay", then "Rivy, Johnny, and
// 2 others".
function listNames(names: string[]): string {
  if (names.length === 0) return "Someone";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  if (names.length === 3) return `${names[0]}, ${names[1]}, and ${names[2]}`;
  const rest = names.length - 2;
  return `${names[0]}, ${names[1]}, and ${rest} other${rest === 1 ? "" : "s"}`;
}

// One digest per recipient per piece, covering both kinds of activity:
// comments left on a piece you wrote, and replies in a thread you're part of
// (which may be on someone else's piece). Either count can be zero, but the
// caller never sends when both are. Who left them leads — that's the news.
export function buildCommentNotificationEmail({
  pieceTitle,
  commentCount,
  replyCount,
  actorNames,
  pieceUrl,
}: CommentNotificationEmailParams): BuiltEmail {
  const title = finishedPieceTitle(pieceTitle);
  const onPiece = `on \u201c${title}\u201d`;
  const who = listNames(actorNames);
  const verb = commentCount > 0 ? "commented" : "replied";
  // The subject stays generic — which piece, not who; the names lead inside.
  const subject = `${commentCount > 0 ? "New comments" : "New replies"} ${onPiece}`;

  const parts = [
    commentCount > 0 &&
      `${commentCount} new comment${commentCount === 1 ? "" : "s"} on your piece`,
    replyCount > 0 &&
      `${replyCount} new ${replyCount === 1 ? "reply" : "replies"} to your comments`,
  ].filter((part): part is string => Boolean(part));
  const summary = `${parts.join(" and ")} since yesterday.`;
  const preview = summary.charAt(0).toUpperCase() + summary.slice(1);

  const footerText =
    commentCount > 0
      ? `You're receiving this because someone commented on your writing on Riff.`
      : `You're receiving this because you're part of the conversation on Riff.`;

  return {
    subject,
    preview,
    html: emailShell({
      title: subject,
      preview,
      // The piece takes the header slot the club name fills in other emails,
      // so the headline doesn't need to repeat it.
      clubName: title,
      footerText,
      content: `
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">${escapeHtml(`${who} ${verb}.`)}</h1>
              <p style="margin:0 0 16px 0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">${preview}</p>
            </td>
          </tr>

          ${emailButton("View the conversation", pieceUrl)}`,
    }),
  };
}
