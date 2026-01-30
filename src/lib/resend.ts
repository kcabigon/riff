/**
 * Resend email service integration
 * Handles sending magic link emails with custom branding
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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
    const { data, error } = await resend.emails.send({
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
    const { data, error } = await resend.emails.send({
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
    const { data, error } = await resend.emails.send({
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
 * Matches Riff branding with neo-brutalist design aesthetic
 */
function getSignInEmailTemplate(magicLink: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to Riff</title>
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
      <h1 class="title">Sign in to Riff</h1>
      <p class="subtitle">For friends who write for fun.</p>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #000000; margin: 0 0 24px 0;">
        Click the button below to sign in to your account:
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
