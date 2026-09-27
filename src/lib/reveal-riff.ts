import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";
import { notifyClubMembers, notifyRiffParticipants } from "@/lib/notifications";
import { batchNotificationsEnabled, sendRiffRevealedEmail } from "@/lib/resend";
import { getBaseUrl } from "@/lib/env";

// Revealing a riff, extracted from the PATCH handler so the cadence cron can do
// it without a user session. Permission checks deliberately stay in the route:
// this function assumes the caller has already established the right to reveal,
// which for the cron means there's nothing to establish.
//
// Kept as one function rather than duplicated in the cron so the two can't
// drift — the volume numbering and the notification pipeline are the parts that
// would silently diverge.

export interface RevealRiffResult {
  riffId: string;
  volumeNumber: number | null;
  pieceCount: number;
  recipients: number;
  emailsSent: number;
}

// actorId null means nobody performed this — a cron reveal. It excludes that
// person from their own notification when present, and excludes no one when not.
export async function revealRiff(
  riffId: string,
  { actorId = null }: { actorId?: string | null } = {}
): Promise<RevealRiffResult> {
  const riff = await prisma.riff.findUnique({
    where: { id: riffId },
    select: { id: true, status: true, clubId: true },
  });

  if (!riff) throw new Error(`revealRiff: riff ${riffId} not found`);
  if (riff.status !== "ACTIVE") {
    throw new Error(
      `revealRiff: riff ${riffId} is ${riff.status}, expected ACTIVE`
    );
  }

  // Volume number is assigned inside the transaction so two simultaneous
  // reveals in the same club can't claim the same number. Clubless riffs have
  // no per-club sequence and don't get one.
  const updatedRiff = await prisma.$transaction(async (tx) => {
    let volumeNumber: number | undefined;
    if (riff.clubId) {
      const revealedCount = await tx.riff.count({
        where: {
          clubId: riff.clubId,
          status: { in: ["REVEALED", "COMPLETED"] },
        },
      });
      volumeNumber = revealedCount + 1;
    }

    return tx.riff.update({
      where: { id: riffId },
      data: {
        status: "REVEALED",
        ...(volumeNumber !== undefined && { volumeNumber }),
      },
      include: {
        club: { select: { id: true, name: true } },
        _count: { select: { pieces: true } },
      },
    });
  });

  const result: RevealRiffResult = {
    riffId,
    volumeNumber: updatedRiff.volumeNumber,
    pieceCount: updatedRiff._count.pieces,
    recipients: 0,
    emailsSent: 0,
  };

  // Notifications are isolated from the transaction: a mail failure must never
  // leave the riff unrevealed, and the reveal is the thing that matters.
  try {
    const riffUrl = `${getBaseUrl()}/riffs/${riffId}`;
    // Excluding the actor only applies when there is one.
    const excludeActor = actorId ? { userId: { not: actorId } } : {};

    if (riff.clubId) {
      await notifyClubMembers(
        riff.clubId,
        NotificationType.RIFF_COMPLETED,
        actorId,
        { riffId }
      ).catch((err) =>
        console.error("[notification error] riff revealed:", err)
      );

      const members = await prisma.clubMember.findMany({
        where: { clubId: riff.clubId, ...excludeActor },
        include: { user: { select: { email: true, name: true } } },
      });
      const enabled = await batchNotificationsEnabled(
        members.map((m) => m.user.email)
      );
      const eligible = members.filter((m) => enabled.has(m.user.email));
      result.recipients = members.length;
      console.info(
        `[notify] riff revealed ${riffId}: ${members.length} members, ${eligible.length} email-enabled`
      );

      const sends = await Promise.allSettled(
        eligible.map((m) =>
          sendRiffRevealedEmail({
            email: m.user.email,
            clubName: updatedRiff.club?.name ?? "your club",
            riffUrl,
            riffTitle: updatedRiff.title,
            volumeNumber: updatedRiff.volumeNumber,
            pieceCount: updatedRiff._count.pieces,
          })
        )
      );
      result.emailsSent = sends.filter((r) => r.status === "fulfilled").length;
      console.info(
        `[notify] riff revealed ${riffId}: ${result.emailsSent} sent, ${sends.length - result.emailsSent} failed`
      );
    } else {
      // Clubless riff — same pipeline, scoped to participants instead of members
      await notifyRiffParticipants(
        riffId,
        NotificationType.RIFF_COMPLETED,
        actorId
      ).catch((err) =>
        console.error("[notification error] riff revealed:", err)
      );

      const participants = await prisma.riffParticipant.findMany({
        where: { riffId, ...excludeActor },
        include: { user: { select: { email: true, name: true } } },
      });
      const enabled = await batchNotificationsEnabled(
        participants.map((p) => p.user.email)
      );
      const eligible = participants.filter((p) => enabled.has(p.user.email));
      result.recipients = participants.length;
      console.info(
        `[notify] riff revealed ${riffId}: ${participants.length} participants, ${eligible.length} email-enabled`
      );

      const sends = await Promise.allSettled(
        eligible.map((p) =>
          sendRiffRevealedEmail({
            email: p.user.email,
            clubName: updatedRiff.title ?? "your riff",
            riffUrl,
            riffTitle: updatedRiff.title,
            volumeNumber: updatedRiff.volumeNumber,
            pieceCount: updatedRiff._count.pieces,
          })
        )
      );
      result.emailsSent = sends.filter((r) => r.status === "fulfilled").length;
      console.info(
        `[notify] riff revealed ${riffId}: ${result.emailsSent} sent, ${sends.length - result.emailsSent} failed`
      );
    }
  } catch (err) {
    console.error("[notification error] riff revealed pipeline failed:", err);
  }

  return result;
}
