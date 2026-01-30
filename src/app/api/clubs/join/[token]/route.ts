import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// POST /api/clubs/join/[token] - Join club using invite token
export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const user = await requireAuth();
    const { token } = await params;
    const userId = (user as any).id;

    // Find the invite
    const invite = await prisma.clubInvite.findUnique({
      where: { token },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            members: {
              where: { userId },
            },
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

    // Check if user is already a member
    if (invite.club.members.length > 0) {
      return NextResponse.json(
        { error: "You are already a member of this club" },
        { status: 400 }
      );
    }

    // Use a transaction to add member and mark invite as used
    const result = await prisma.$transaction(async (tx) => {
      // Add user to club as MEMBER
      const newMember = await tx.clubMember.create({
        data: {
          clubId: invite.clubId,
          userId,
          role: "MEMBER",
        },
      });

      // Mark invite as used
      const updatedInvite = await tx.clubInvite.update({
        where: { id: invite.id },
        data: {
          usedAt: new Date(),
          usedBy: userId,
        },
      });

      // Update user's lastActiveClubId
      await tx.user.update({
        where: { id: userId },
        data: {
          lastActiveClubId: invite.clubId,
        },
      });

      return { member: newMember, invite: updatedInvite };
    });

    return NextResponse.json(
      {
        success: true,
        clubId: invite.clubId,
        clubName: invite.club.name,
        member: result.member,
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error joining club:", error);
    return NextResponse.json(
      { error: "An error occurred while joining the club" },
      { status: 500 }
    );
  }
}
