import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// POST /api/clubs/[id]/invites - Generate new invite token
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: clubId } = await params;

    // Check if club exists
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        members: {
          where: { userId: (user as any).id },
        },
      },
    });

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    // Check if user is a member of the club
    if (club.members.length === 0) {
      return NextResponse.json(
        { error: "You must be a club member to create invites" },
        { status: 403 }
      );
    }

    // Generate invite token with 30-day expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const invite = await prisma.clubInvite.create({
      data: {
        clubId,
        token: generateToken(),
        createdBy: (user as any).id,
        expiresAt,
      },
    });

    // Build the shareable URL
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const inviteUrl = `${baseUrl}/clubs/join/${invite.token}`;

    return NextResponse.json(
      {
        success: true,
        invite: {
          id: invite.id,
          token: invite.token,
          url: inviteUrl,
          expiresAt: invite.expiresAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error creating invite:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the invite" },
      { status: 500 }
    );
  }
}

// Helper function to generate a unique token
function generateToken(): string {
  // Generate a random string (similar to CUID but simpler)
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
