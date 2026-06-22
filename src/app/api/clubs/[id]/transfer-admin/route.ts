import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { sendHostTransferredEmail } from "@/lib/resend";

// POST /api/clubs/[id]/transfer-admin - Transfer club admin to another member
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: clubId } = await params;
    const { targetUserId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json(
        { error: "targetUserId is required" },
        { status: 400 }
      );
    }

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
        { error: "Only the club admin can transfer ownership" },
        { status: 403 }
      );
    }

    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: "You are already the admin" },
        { status: 400 }
      );
    }

    const targetMember = club.members.find((m) => m.userId === targetUserId);
    if (!targetMember) {
      return NextResponse.json(
        { error: "Target user is not a member of this club" },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Update club admin
      await tx.club.update({
        where: { id: clubId },
        data: {
          adminId: targetUserId,
          moderatorId: null,
        },
      });

      // Demote old co-host to member (if any) — moderatorId is cleared above
      if (club.moderatorId && club.moderatorId !== targetUserId) {
        const oldCoHostMember = club.members.find(
          (m) => m.userId === club.moderatorId
        );
        if (oldCoHostMember) {
          await tx.clubMember.update({
            where: { id: oldCoHostMember.id },
            data: { role: "MEMBER" },
          });
        }
      }

      // Demote old admin to member
      const oldAdminMember = club.members.find((m) => m.userId === user.id);
      if (oldAdminMember) {
        await tx.clubMember.update({
          where: { id: oldAdminMember.id },
          data: { role: "MEMBER" },
        });
      }

      // Promote new admin
      await tx.clubMember.update({
        where: { id: targetMember.id },
        data: { role: "ADMIN" },
      });
    });

    const baseUrl = process.env.NEXTAUTH_URL || "https://letsriff.app";
    const clubUrl = `${baseUrl}/clubs/${clubId}`;
    const oldAdminUser = club.members.find((m) => m.userId === user.id)?.user;
    const newAdminUser = club.members.find(
      (m) => m.userId === targetUserId
    )?.user;

    const emailRecipients = [oldAdminUser, newAdminUser].filter(
      (u) => u?.email && u.emailNotifications
    ) as { name: string | null; email: string }[];

    await Promise.allSettled(
      emailRecipients.map((recipient) =>
        sendHostTransferredEmail({
          email: recipient.email,
          oldHostName: oldAdminUser?.name || "Someone",
          newHostName: newAdminUser?.name || "Someone",
          clubName: club.name,
          clubUrl,
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error transferring admin:", error);
    return NextResponse.json(
      { error: "An error occurred while transferring ownership" },
      { status: 500 }
    );
  }
}
