import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { sendCoHostAssignedEmail } from "@/lib/resend";

// POST /api/clubs/[id]/assign-cohost - Assign, re-assign, or remove co-host
// Pass targetUserId: string to assign, null to remove
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: clubId } = await params;
    const { targetUserId } = await req.json();

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                emailNotifications: true,
              },
            },
          },
        },
      },
    });

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    if (club.adminId !== user.id) {
      return NextResponse.json(
        { error: "Only the club admin can assign a co-host" },
        { status: 403 }
      );
    }

    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: "You are already the admin" },
        { status: 400 }
      );
    }

    if (targetUserId !== null) {
      const targetMember = club.members.find((m) => m.userId === targetUserId);
      if (!targetMember) {
        return NextResponse.json(
          { error: "Target user is not a member of this club" },
          { status: 404 }
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      // Demote existing co-host to member (if any)
      if (club.moderatorId) {
        const existingModerator = club.members.find(
          (m) => m.userId === club.moderatorId
        );
        if (existingModerator) {
          await tx.clubMember.update({
            where: { id: existingModerator.id },
            data: { role: "MEMBER" },
          });
        }
      }

      if (targetUserId) {
        // Promote new co-host
        const targetMember = club.members.find(
          (m) => m.userId === targetUserId
        );
        if (targetMember) {
          await tx.clubMember.update({
            where: { id: targetMember.id },
            data: { role: "MODERATOR" },
          });
        }
        await tx.club.update({
          where: { id: clubId },
          data: { moderatorId: targetUserId },
        });
      } else {
        // Remove co-host
        await tx.club.update({
          where: { id: clubId },
          data: { moderatorId: null },
        });
      }
    });

    // Send email to newly assigned co-host
    if (targetUserId) {
      const newCoHost = club.members.find(
        (m) => m.userId === targetUserId
      )?.user;
      const adminUser = club.members.find((m) => m.userId === user.id)?.user;

      if (newCoHost?.email && newCoHost.emailNotifications) {
        const baseUrl = process.env.NEXTAUTH_URL || "https://letsriff.app";
        await sendCoHostAssignedEmail({
          email: newCoHost.email,
          coHostName: newCoHost.name || "there",
          adminName: adminUser?.name || "The host",
          clubName: club.name,
          clubUrl: `${baseUrl}/clubs/${clubId}`,
        }).catch((err) =>
          console.error("Error sending co-host assigned email:", err)
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error assigning co-host:", error);
    return NextResponse.json(
      { error: "An error occurred while assigning co-host" },
      { status: 500 }
    );
  }
}
