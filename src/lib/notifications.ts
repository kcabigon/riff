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

  const notifications = members
    .filter((m) => m.userId !== actorId)
    .map((m) =>
      createNotification({
        type,
        recipientId: m.userId,
        actorId,
        clubId,
        ...extra,
      })
    );

  return Promise.allSettled(notifications);
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
