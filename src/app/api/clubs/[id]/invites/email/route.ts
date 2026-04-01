import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { sendClubInviteEmail } from "@/lib/resend";

// POST /api/clubs/[id]/invites/email - Send email invitations
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: clubId } = await params;
    const { emails } = await req.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: "At least one email address is required" },
        { status: 400 }
      );
    }

    // Check if club exists and user is a member
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        members: {
          where: { userId: user.id },
        },
      },
    });

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    if (club.members.length === 0) {
      return NextResponse.json(
        { error: "You must be a club member to send invites" },
        { status: 403 }
      );
    }

    // Get inviter's name
    const inviter = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        firstName: true,
        lastName: true,
      },
    });

    const inviterName =
      inviter && inviter.firstName && inviter.lastName
        ? `${inviter.firstName} ${inviter.lastName}`
        : "A friend";

    // Generate a single invite token for all emails
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const invite = await prisma.clubInvite.create({
      data: {
        clubId,
        token: generateToken(),
        createdBy: user.id,
        expiresAt,
      },
    });

    // Build the invite URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/clubs/join/${invite.token}`;

    // Send emails to all recipients
    const emailResults = await Promise.allSettled(
      emails.map((email) =>
        sendClubInviteEmail(email, club.name, inviteUrl, inviterName)
      )
    );

    // Count successes and failures
    const successCount = emailResults.filter(
      (result) => result.status === "fulfilled"
    ).length;
    const failureCount = emailResults.filter(
      (result) => result.status === "rejected"
    ).length;

    // Get error messages for failed emails
    const errors = emailResults
      .filter((result) => result.status === "rejected")
      .map((result, index) => ({
        email: emails[index],
        error:
          (result as PromiseRejectedResult).reason?.message || "Unknown error",
      }));

    if (successCount === 0) {
      return NextResponse.json(
        { error: "Failed to send all invitations", details: errors },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        sentCount: successCount,
        failedCount: failureCount,
        inviteToken: invite.token,
        inviteUrl,
        ...(failureCount > 0 && { failures: errors }),
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error sending invite emails:", error);
    return NextResponse.json(
      { error: "An error occurred while sending invitations" },
      { status: 500 }
    );
  }
}

// Helper function to generate a unique token
function generateToken(): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
