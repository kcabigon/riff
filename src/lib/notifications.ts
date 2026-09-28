import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";

interface CreateNotificationInput {
  type: NotificationType;
  recipientId: string;
  // Null for system-driven notifications (the cadence cron) — stored as null
  // either way, see the write below.
  actorId?: string | null;
  clubId?: string;
  riffId?: string;
  pieceId?: string;
  commentId?: string;
}

export async function createNotification(input: CreateNotificationInput) {
  // Don't notify yourself
  if (input.actorId && input.actorId === input.recipientId) return null;

  return prisma.notification.create({
    data: {
      type: input.type,
      recipientId: input.recipientId,
      actorId: input.actorId || null,
      clubId: input.clubId || null,
      riffId: input.riffId || null,
      pieceId: input.pieceId || null,
      commentId: input.commentId || null,
    },
  });
}

// Notifies an already-known set of users. Callers that had to load those users
// anyway — to get their email addresses, almost always — should use this rather
// than notifyClubMembers, which would load the same rows a second time.
export async function notifyUsers(
  recipientIds: string[],
  type: NotificationType,
  actorId: string | null,
  extra: Omit<CreateNotificationInput, "type" | "recipientId" | "actorId"> = {}
) {
  return Promise.allSettled(
    recipientIds
      .filter((id) => id !== actorId)
      .map((id) =>
        createNotification({ type, recipientId: id, actorId, ...extra })
      )
  );
}

export async function notifyClubMembers(
  clubId: string,
  type: NotificationType,
  // Nullable so a cron-driven action can notify everyone — there is no actor
  // to exclude, and createNotification already stores a falsy actorId as null.
  actorId: string | null,
  extra: Omit<
    CreateNotificationInput,
    "type" | "recipientId" | "actorId" | "clubId"
  > = {}
) {
  const members = await prisma.clubMember.findMany({
    where: { clubId },
    select: { userId: true },
  });

  return notifyUsers(
    members.map((m) => m.userId),
    type,
    actorId,
    { clubId, ...extra }
  );
}

export async function notifyRiffParticipants(
  riffId: string,
  type: NotificationType,
  // Nullable so a cron-driven action can notify everyone — there is no actor
  // to exclude, and createNotification already stores a falsy actorId as null.
  actorId: string | null,
  extra: Omit<
    CreateNotificationInput,
    "type" | "recipientId" | "actorId" | "riffId"
  > = {}
) {
  const participants = await prisma.riffParticipant.findMany({
    where: { riffId },
    select: { userId: true },
  });

  const notifications = participants
    .filter((p) => p.userId !== actorId)
    .map((p) =>
      createNotification({
        type,
        recipientId: p.userId,
        actorId,
        riffId,
        ...extra,
      })
    );

  return Promise.allSettled(notifications);
}
