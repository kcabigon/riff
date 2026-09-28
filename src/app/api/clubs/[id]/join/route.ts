import { NextResponse } from "next/server";
import { firstNameOf, fullNameOf } from "@/lib/names";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notifyClubMembers } from "@/lib/notifications";
import {
  batchNotificationsEnabled,
  buildMemberJoinedEmail,
  deliverMany,
} from "@/lib/resend";
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
      select: { name: true, firstName: true, username: true },
    });

    // Notify existing members and send emails — isolated so failures don't affect the join response
    try {
      const clubUrl = `${getBaseUrl()}/clubs/${clubId}`;

      await notifyClubMembers(
        clubId,
        NotificationType.CLUB_MEMBER_JOINED,
        userId,
        {}
      ).catch((err) =>
        console.error("[notification error] member joined:", err)
      );

      const members = await prisma.clubMember.findMany({
        where: { clubId, userId: { not: userId } },
        include: { user: { select: { email: true } } },
      });
      const enabled = await batchNotificationsEnabled(
        members.map((m) => m.user.email)
      );
      const eligibleMembers = members.filter((m) => enabled.has(m.user.email));
      console.info(
        `[notify] member joined club ${clubId}: ${members.length} members, ${eligibleMembers.length} email-enabled`
      );
      // The same email for everyone, so it's built once.
      const email = buildMemberJoinedEmail({
        // Full name: a join introduces someone others may not know.
        newMemberFullName: fullNameOf(newMember),
        newMemberFirstName: firstNameOf(newMember),
        clubName: club!.name,
        clubUrl,
        // Everyone else, plus the new member.
        memberCount: members.length + 1,
      });
      const delivered = await deliverMany(
        eligibleMembers.map((m) => ({ to: m.user.email, email })),
        "memberJoined"
      );
      const sent = delivered.filter(Boolean).length;
      const failed = delivered.length - sent;
      console.info(
        `[notify] member joined club ${clubId}: ${sent} sent, ${failed} failed`
      );
    } catch (err) {
      console.error("[notification error] member joined pipeline failed:", err);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error joining club:", error);
    return NextResponse.json({ error: "Failed to join club" }, { status: 500 });
  }
}
