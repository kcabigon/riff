/**
 * Resend email service integration
 * Handles sending magic link emails with custom branding
 */

import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

/**
 * Send a magic link email for authentication (existing users)
 * @param email - Recipient email address
 * @param magicLink - The magic link URL for authentication
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
 * @param email - Recipient email address
 * @param magicLink - The magic link URL to start onboarding
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
 * @param email - Recipient email address
 * @param clubName - Name of the club
 * @param inviteUrl - The invite link URL to join the club
 * @param inviterName - Name of the person who sent the invite
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
    const { data, error } = await resend.emails.send({
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
    const { data, error } = await resend.emails.send({
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

/**
 * Generate HTML email template for sign-in (existing users)
 */
function getSignInEmailTemplate(magicLink: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to Riff</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=DM+Serif+Text&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:48px 24px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background-color:#ffffff;border:2px solid #000000;">

          <!-- Logo section -->
          <tr>
            <td align="center" style="padding:48px 40px 32px;">
              <img src="https://raw.githubusercontent.com/kcabigon/riff/feature/signin-email-redesign/public/images/riff_logo_email.png" alt="Riff" width="160" height="149" style="display:block;margin:0 auto;" />
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="height:2px;background-color:#000000;font-size:0;line-height:0;">&nbsp;</td></tr></table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px 40px 16px;">
              <h1 style="margin:0 0 16px 0;font-size:28px;font-weight:400;color:#000000;line-height:1.2;font-family:'DM Serif Text',Georgia,serif;">You've got a magic link.</h1>
              <p style="margin:0;font-size:16px;font-weight:300;color:#444444;line-height:1.6;font-family:'DM Sans',-apple-system,sans-serif;">Tap the button below to sign in to Riff. This link is yours — don't share it.</p>
            </td>
          </tr>

          <!-- Button with email-safe offset shadow -->
          <tr>
            <td style="padding:32px 40px;" align="center">
              <table cellpadding="0" cellspacing="0" style="background-color:#000000;">
                <tr>
                  <td style="padding:0 4px 4px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background-color:#00FF66;border:2px solid #000000;text-align:center;">
                          <a href="${magicLink}" style="display:block;padding:16px 48px;font-size:17px;font-weight:700;color:#000000;text-decoration:none;font-family:'DM Sans',-apple-system,sans-serif;white-space:nowrap;">
                            Sign in to Riff →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Expiry -->
          <tr>
            <td style="padding:0 40px 40px;">
              <p style="margin:0;font-size:13px;font-weight:300;color:#999999;line-height:1.5;font-family:'DM Sans',-apple-system,sans-serif;">This link expires in 24 hours and can only be used once. If you didn't request this, ignore it.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 32px;border-top:1px solid #eeeeee;">
              <p style="margin:0 0 6px 0;font-size:12px;font-weight:300;color:#bbbbbb;font-family:'DM Sans',-apple-system,sans-serif;">Button not working? Copy this link into your browser:</p>
              <p style="margin:0;font-size:11px;word-break:break-all;">
                <a href="${magicLink}" style="color:#888888;">${magicLink}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
}

/**
 * Generate HTML email template for onboarding (new users)
 * Matches Riff branding with neo-brutalist design aesthetic
 */
function getOnboardingEmailTemplate(magicLink: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Riff</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      background-color: #ffffff;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      padding: 40px 24px;
      background-color: #ffffff;
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .title {
      font-size: 24px;
      font-weight: 400;
      color: #000000;
      margin: 0 0 8px 0;
    }
    .subtitle {
      font-size: 16px;
      font-weight: 300;
      color: #959595;
      margin: 0;
    }
    .content {
      margin: 32px 0;
      text-align: center;
    }
    .button {
      display: inline-block;
      padding: 12px 48px;
      background-color: #00FF66;
      color: #000000;
      text-decoration: none;
      font-size: 16px;
      font-weight: 300;
      border: 2px solid #000000;
      box-shadow: 8px 8px 0px 0px #000000;
      margin: 16px 0;
      transition: all 0.2s;
    }
    .button:hover {
      box-shadow: 4px 4px 0px 0px #000000;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #E6E6E6;
      text-align: center;
      font-size: 14px;
      color: #959595;
    }
    .link {
      color: #000000;
      text-decoration: underline;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">Welcome to Riff!</h1>
      <p class="subtitle">For friends who write for fun.</p>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #000000; margin: 0 0 24px 0;">
        You're one click away from joining your friends in a private space to share your writing.
        Let's get you set up!
      </p>

      <a href="${magicLink}" class="button">
        Let's do this shit
      </a>

      <p style="font-size: 14px; color: #959595; margin: 24px 0 0 0;">
        This link will expire in 24 hours and can only be used once.
      </p>
    </div>

    <div class="footer">
      <p>
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <p>
        <a href="${magicLink}" class="link">${magicLink}</a>
      </p>
      <p style="margin-top: 16px;">
        If you didn't request this email, you can safely ignore it.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate HTML email template for club invitations
 * Matches Riff branding with neo-brutalist design aesthetic
 */
function getClubInviteEmailTemplate(
  clubName: string,
  inviteUrl: string,
  inviterName: string
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Join ${clubName} on Riff</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      background-color: #ffffff;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      padding: 40px 24px;
      background-color: #ffffff;
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .title {
      font-size: 24px;
      font-weight: 400;
      color: #000000;
      margin: 0 0 8px 0;
    }
    .subtitle {
      font-size: 16px;
      font-weight: 300;
      color: #959595;
      margin: 0;
    }
    .content {
      margin: 32px 0;
      text-align: center;
    }
    .club-name {
      font-size: 20px;
      font-weight: 500;
      color: #000000;
      margin: 16px 0;
      padding: 16px;
      background-color: #F9F9F9;
      border: 2px solid #000000;
    }
    .button {
      display: inline-block;
      padding: 12px 48px;
      background-color: #00FF66;
      color: #000000;
      text-decoration: none;
      font-size: 16px;
      font-weight: 300;
      border: 2px solid #000000;
      box-shadow: 8px 8px 0px 0px #000000;
      margin: 16px 0;
      transition: all 0.2s;
    }
    .button:hover {
      box-shadow: 4px 4px 0px 0px #000000;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #E6E6E6;
      text-align: center;
      font-size: 14px;
      color: #959595;
    }
    .link {
      color: #000000;
      text-decoration: underline;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">You're Invited!</h1>
      <p class="subtitle">For friends who write for fun.</p>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #000000; margin: 0 0 16px 0;">
        <strong>\${inviterName}</strong> has invited you to join their club on Riff:
      </p>

      <div class="club-name">
        \${clubName}
      </div>

      <p style="font-size: 16px; color: #000000; margin: 24px 0;">
        Riff is a private space for friends to share their writing, give feedback, and connect through long-form creativity.
      </p>

      <a href="\${inviteUrl}" class="button">
        Join Club
      </a>

      <p style="font-size: 14px; color: #959595; margin: 24px 0 0 0;">
        This invitation link will expire in 30 days.
      </p>
    </div>

    <div class="footer">
      <p>
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <p>
        <a href="\${inviteUrl}" class="link">\${inviteUrl}</a>
      </p>
      <p style="margin-top: 16px;">
        If you don't know \${inviterName} or didn't expect this invitation, you can safely ignore this email.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate HTML email template for riff revealed notification
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
    ? `<p style="font-size: 20px; font-weight: 500; color: #000000; margin: 0 0 12px 0;">${displayTitle}</p>`
    : "";

  const pieceLabel = pieceCount === 1 ? "1 piece" : `${pieceCount} pieces`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Riff revealed in ${clubName}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      background-color: #ffffff;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      padding: 40px 24px;
      background-color: #ffffff;
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .title {
      font-size: 24px;
      font-weight: 400;
      color: #000000;
      margin: 0 0 8px 0;
    }
    .subtitle {
      font-size: 16px;
      font-weight: 300;
      color: #959595;
      margin: 0;
    }
    .content {
      margin: 32px 0;
    }
    .riff-box {
      border: 2px solid #000000;
      padding: 24px;
      margin: 24px 0;
      background-color: #FAFAFA;
    }
    .button {
      display: inline-block;
      padding: 12px 48px;
      background-color: #00FF66;
      color: #000000;
      text-decoration: none;
      font-size: 16px;
      font-weight: 300;
      border: 2px solid #000000;
      box-shadow: 8px 8px 0px 0px #000000;
      margin: 24px 0 0 0;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #E6E6E6;
      text-align: center;
      font-size: 14px;
      color: #959595;
    }
    .link {
      color: #000000;
      text-decoration: underline;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">The pieces are in.</h1>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #000000; margin: 0 0 24px 0; font-weight: 300;">
        A riff in <strong>${clubName}</strong> has been revealed.
      </p>

      <div class="riff-box">
        ${titleBlock}
        <p style="font-size: 16px; font-weight: 300; color: #808080; margin: 0;">${pieceLabel} submitted</p>
      </div>

      <a href="${riffUrl}" class="button">
        Read pieces
      </a>
    </div>

    <div class="footer">
      <p>
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <p>
        <a href="${riffUrl}" class="link">${riffUrl}</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate HTML email template for riff creation notification
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
    ? `<p style="font-size: 20px; font-weight: 500; color: #000000; margin: 0 0 16px 0;">${riffTitle}</p>`
    : "";

  const promptBlock = prompt
    ? `<div style="border-left: 3px solid #000000; padding-left: 16px; margin: 16px 0;">
        <p style="font-size: 16px; font-weight: 300; color: #000000; margin: 0; line-height: 1.6; font-style: italic;">${prompt}</p>
      </div>`
    : "";

  const deadlineBlock =
    deadlineStr && daysFromNow !== null
      ? `<p style="font-size: 14px; font-weight: 300; color: #808080; margin: 16px 0 0 0;">Deadline: ${deadlineStr} &middot; ${daysFromNow} day${daysFromNow === 1 ? "" : "s"} from now</p>`
      : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New riff in ${clubName}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      background-color: #ffffff;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      padding: 40px 24px;
      background-color: #ffffff;
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .title {
      font-size: 24px;
      font-weight: 400;
      color: #000000;
      margin: 0 0 8px 0;
    }
    .subtitle {
      font-size: 16px;
      font-weight: 300;
      color: #959595;
      margin: 0;
    }
    .content {
      margin: 32px 0;
    }
    .riff-box {
      border: 2px solid #000000;
      padding: 24px;
      margin: 24px 0;
      background-color: #FAFAFA;
    }
    .button {
      display: inline-block;
      padding: 12px 48px;
      background-color: #00FF66;
      color: #000000;
      text-decoration: none;
      font-size: 16px;
      font-weight: 300;
      border: 2px solid #000000;
      box-shadow: 8px 8px 0px 0px #000000;
      margin: 24px 0 0 0;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #E6E6E6;
      text-align: center;
      font-size: 14px;
      color: #959595;
    }
    .link {
      color: #000000;
      text-decoration: underline;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">New riff dropped.</h1>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #000000; margin: 0 0 24px 0; font-weight: 300;">
        <strong>${actorName}</strong> just started a new riff in <strong>${clubName}</strong>.
      </p>

      <div class="riff-box">
        ${titleBlock}
        ${promptBlock}
        ${deadlineBlock}
      </div>

      <a href="${clubUrl}" class="button">
        Join riff
      </a>
    </div>

    <div class="footer">
      <p>
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <p>
        <a href="${clubUrl}" class="link">${clubUrl}</a>
      </p>
      <p style="margin-top: 16px;">
        You're receiving this because you're a member of ${clubName} on Riff.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
