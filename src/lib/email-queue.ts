import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";
import { sendCommentDigestEmail } from "@/lib/resend";

interface EnqueueCommentEmailInput {
  recipientId: string;
  actorId: string;
  pieceId: string;
  commentId: string;
  clubId?: string;
  riffId?: string;
}

/**
 * Enqueue a comment notification email for batched sending.
 * Skips self-notifications (when actor === recipient).
 */
export async function enqueueCommentEmail(
  input: EnqueueCommentEmailInput
): Promise<void> {
  if (input.actorId === input.recipientId) return;

  await prisma.emailQueue.create({
    data: {
      type: NotificationType.NEW_COMMENT,
      recipientId: input.recipientId,
      actorId: input.actorId,
      pieceId: input.pieceId,
      commentId: input.commentId,
      clubId: input.clubId || null,
      riffId: input.riffId || null,
    },
  });
}

/**
 * Format actor names for display.
 * 1 person: "Alice"
 * 2 people: "Alice and Bob"
 * 3+ people: "Alice, Bob, and 2 others"
 */
function formatActorNames(names: string[]): string {
  if (names.length === 0) return "Someone";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names[0]}, ${names[1]}, and ${names.length - 2} other${names.length - 2 === 1 ? "" : "s"}`;
}

/**
 * Flush the comment email queue. Groups pending items by recipient + piece,
 * sends one digest email per group, then marks items as processed.
 *
 * Only processes items older than 2 minutes to avoid racing with
 * in-flight requests.
 */
export async function flushCommentEmailQueue(): Promise<{
  emailsSent: number;
  queueItemsProcessed: number;
}> {
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

  // Find all unprocessed items older than 2 minutes
  const pendingItems = await prisma.emailQueue.findMany({
    where: {
      processedAt: null,
      type: NotificationType.NEW_COMMENT,
      createdAt: { lt: twoMinutesAgo },
    },
    include: {
      recipient: {
        select: { email: true, firstName: true, lastName: true },
      },
      actor: {
        select: { firstName: true, lastName: true },
      },
      piece: {
        select: { id: true, title: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (pendingItems.length === 0) {
    return { emailsSent: 0, queueItemsProcessed: 0 };
  }

  // Group by recipient + piece
  const groups = new Map<
    string,
    {
      recipientEmail: string;
      recipientName: string;
      pieceId: string;
      pieceTitle: string;
      actorNames: string[];
      commentCount: number;
      clubId: string | null;
      riffId: string | null;
      itemIds: string[];
    }
  >();

  for (const item of pendingItems) {
    const key = `${item.recipientId}:${item.pieceId}`;
    const existing = groups.get(key);
    const actorName =
      item.actor.firstName && item.actor.lastName
        ? `${item.actor.firstName} ${item.actor.lastName}`
        : item.actor.firstName || "Someone";

    if (existing) {
      if (!existing.actorNames.includes(actorName)) {
        existing.actorNames.push(actorName);
      }
      existing.commentCount++;
      existing.itemIds.push(item.id);
    } else {
      const recipientName =
        item.recipient.firstName || item.recipient.email.split("@")[0];
      groups.set(key, {
        recipientEmail: item.recipient.email,
        recipientName,
        pieceId: item.piece.id,
        pieceTitle: item.piece.title || "Untitled",
        actorNames: [actorName],
        commentCount: 1,
        clubId: item.clubId,
        riffId: item.riffId,
        itemIds: [item.id],
      });
    }
  }

  // Send digest emails and mark as processed
  let emailsSent = 0;
  const allProcessedIds: string[] = [];

  for (const group of groups.values()) {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const pieceUrl = `${baseUrl}/read/${group.pieceId}`;

    try {
      await sendCommentDigestEmail({
        email: group.recipientEmail,
        recipientName: group.recipientName,
        pieceTitle: group.pieceTitle,
        commentCount: group.commentCount,
        actorNames: formatActorNames(group.actorNames),
        pieceUrl,
      });
      emailsSent++;
    } catch (err) {
      console.error(
        `Failed to send comment digest to ${group.recipientEmail}:`,
        err
      );
    }

    allProcessedIds.push(...group.itemIds);
  }

  // Mark all items as processed regardless of email success
  // (to prevent infinite retry loops — failed emails can be investigated via logs)
  if (allProcessedIds.length > 0) {
    await prisma.emailQueue.updateMany({
      where: { id: { in: allProcessedIds } },
      data: { processedAt: new Date() },
    });
  }

  return { emailsSent, queueItemsProcessed: allProcessedIds.length };
}
