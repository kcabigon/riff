import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notifyClubMembers } from "@/lib/notifications";
import { sendMemberJoinedEmail, batchNotificationsEnabled } from "@/lib/resend";
import { NotificationType } from "@prisma/client";
import { getBaseUrl } from "@/lib/env";

// POST /api/clubs/[id]/join — Join a club via the public join link
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clubId } = await params;
    const user = await requireAuth();
    const userId = user.id;

    // Check club exists
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true, name: true },
    });

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    // Idempotent — return success if already a member
    const existing = await prisma.clubMember.findFirst({
      where: { clubId, userId },
    });

    if (existing) {
      return NextResponse.json({ success: true, alreadyMember: true });
    }

    // Create membership
    await prisma.clubMember.create({
      data: { clubId, userId },
    });

    // Update lastActiveClubId
    const newMember = await prisma.user.update({
      where: { id: userId },
      data: { lastActiveClubId: clubId },
      select: { name: true, firstName: true },
    });

    // Notify existing members and send emails
    const clubUrl = `${getBaseUrl()}/clubs/${clubId}`;

    await notifyClubMembers(
      clubId,
      NotificationType.CLUB_MEMBER_JOINED,
      userId,
      {}
    ).catch((err) => console.error("[notification error] member joined:", err));

    const members = await prisma.clubMember.findMany({
      where: { clubId, userId: { not: userId } },
      include: { user: { select: { email: true } } },
    });
    const enabled = await batchNotificationsEnabled(
      members.map((m) => m.user.email)
    );
    await Promise.allSettled(
      members
        .filter((m) => enabled.has(m.user.email))
        .map((m) =>
          sendMemberJoinedEmail({
            email: m.user.email,
            newMemberFullName: newMember.name || "A new member",
            newMemberFirstName:
              newMember.firstName || newMember.name?.split(" ")[0] || "them",
            clubName: club!.name,
            clubUrl,
          })
        )
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error joining club:", error);
    return NextResponse.json({ error: "Failed to join club" }, { status: 500 });
  }
}
