import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/clubs/invites/[token] - Validate token and return club info
export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Find the invite
    const invite = await prisma.clubInvite.findUnique({
      where: { token },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            description: true,
            bannerImage: true,
            _count: {
              select: { members: true },
            },
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invite not found" },
        { status: 404 }
      );
    }

    // Check if invite has expired
    if (new Date() > invite.expiresAt) {
      return NextResponse.json(
        { error: "Invite has expired" },
        { status: 410 }
      );
    }

    // Check if invite has already been used
    if (invite.usedAt) {
      return NextResponse.json(
        { error: "Invite has already been used" },
        { status: 410 }
      );
    }

    // Return club info for preview
    return NextResponse.json({
      success: true,
      club: {
        id: invite.club.id,
        name: invite.club.name,
        description: invite.club.description,
        bannerUrl: invite.club.bannerImage,
        memberCount: invite.club._count.members,
      },
      invitedBy: {
        name: `${invite.creator.firstName} ${invite.creator.lastName}`.trim() || "A friend",
      },
      expiresAt: invite.expiresAt,
    });
  } catch (error: any) {
    console.error("Error validating invite:", error);
    return NextResponse.json(
      { error: "An error occurred while validating the invite" },
      { status: 500 }
    );
  }
}
