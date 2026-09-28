import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";
import { notifyUsers } from "@/lib/notifications";
import { sendParticipantJoinedEmail } from "@/lib/resend";
import { getBaseUrl } from "@/lib/env";
import { fullNameOf } from "@/lib/names";

// Someone joined an open (clubless) riff — by its link, by attaching a draft,
// or by starting one there. Everyone already in it gets the in-app line, and
// so does the creator even if they never joined their own riff. Only the
// creator gets an email: they shared the link, so a join is their confirmation
// it worked, whereas a big open riff mailing every participant on every join
// would be noise — the riff page already shows who's in. Club riffs don't call
// this; a club join is announced by member-joined.
//
// Call after the participant row is written. Failures are logged, never thrown
// — the join has already happened.
export async function notifyOpenRiffParticipantJoined(
  riffId: string,
  joinerId: string
): Promise<void> {
  try {
    const [riff, joiner] = await Promise.all([
      prisma.riff.findUnique({
        where: { id: riffId },
        select: {
          title: true,
          creatorId: true,
          creator: { select: { email: true, emailNotifications: true } },
          participants: { select: { userId: true } },
        },
      }),
      prisma.user.findUnique({
        where: { id: joinerId },
        select: { name: true, firstName: true, username: true },
      }),
    ]);
    if (!riff) return;

    const inAppRecipients = new Set(
      riff.participants.map((p) => p.userId).concat(riff.creatorId)
    );
    inAppRecipients.delete(joinerId);
    await notifyUsers(
      [...inAppRecipients],
      NotificationType.RIFF_PARTICIPANT_JOINED,
      joinerId,
      { riffId }
    );

    if (riff.creatorId === joinerId || !riff.creator.emailNotifications) return;
    await sendParticipantJoinedEmail({
      email: riff.creator.email,
      // Full name: a join introduces someone the creator may not know.
      newParticipantFullName: fullNameOf(joiner),
      riffName: riff.title || "Your riff",
      riffUrl: `${getBaseUrl()}/riffs/${riffId}`,
      // Includes the joiner, whose row is already written.
      participantCount: riff.participants.length,
    });
  } catch (err) {
    console.error("[notification error] participant joined:", err);
  }
}
