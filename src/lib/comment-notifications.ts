import { prisma } from "@/lib/prisma";
import { sendCommentNotificationEmail } from "@/lib/resend";

type DigestGroup = {
  recipientId: string;
  pieceId: string;
  pieceTitle: string;
  // Carried so the email can deep-link into the conversation the same way the
  // notification bell does, rather than dropping the reader at the top of the
  // piece. Null for standalone pieces that aren't attached to a riff.
  riffId: string | null;
  commentCount: number;
  replyCount: number;
};

export async function runCommentNotifications(): Promise<{
  emailsSent: number;
  piecesWithComments: number;
}> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const comments = await prisma.comment.findMany({
    where: { createdAt: { gte: since } },
    include: {
      piece: {
        select: {
          id: true,
          title: true,
          authorId: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Threads touched by a new reply, keyed by the comment each reply hangs off.
  // The UI only ever posts replies against a top-level comment, but the API
  // doesn't enforce that, so a parent here may itself be a reply.
  const threadIds = new Set(
    comments
      .filter((comment) => comment.parentId !== null)
      .map((comment) => comment.parentId as string)
  );

  // Everyone already in those threads — the starter plus every replier, over
  // the thread's whole history, not just the last 24h. One query, not one per
  // thread.
  const threadParticipants = new Map<string, Set<string>>();
  if (threadIds.size > 0) {
    const ids = [...threadIds];
    const threadComments = await prisma.comment.findMany({
      where: { OR: [{ id: { in: ids } }, { parentId: { in: ids } }] },
      select: { id: true, parentId: true, authorId: true },
    });
    for (const comment of threadComments) {
      // A comment matched by its own id is the thread root, even when it has a
      // parent of its own. Keying off parentId first would file it under its
      // grandparent and orphan the whole thread, silently notifying no one.
      const threadId = threadIds.has(comment.id)
        ? comment.id
        : (comment.parentId as string);
      const participants =
        threadParticipants.get(threadId) ?? new Set<string>();
      participants.add(comment.authorId);
      threadParticipants.set(threadId, participants);
    }
  }

  // Keyed by recipient + piece so one person gets a single email per piece
  // covering both comments on their own writing and replies in their threads.
  const groups = new Map<string, DigestGroup>();
  const recipientIds = new Set<string>();

  const bump = (
    recipientId: string,
    comment: (typeof comments)[number],
    kind: "comment" | "reply"
  ) => {
    if (recipientId === comment.authorId) return;
    recipientIds.add(recipientId);
    const key = `${recipientId}:${comment.pieceId}`;
    const existing = groups.get(key);
    if (existing) {
      if (kind === "comment") existing.commentCount++;
      else existing.replyCount++;
      return;
    }
    groups.set(key, {
      recipientId,
      pieceId: comment.pieceId,
      pieceTitle: comment.piece.title || "Untitled",
      riffId: comment.riffId,
      commentCount: kind === "comment" ? 1 : 0,
      replyCount: kind === "reply" ? 1 : 0,
    });
  };

  for (const comment of comments) {
    if (comment.parentId === null) {
      // Top-level comment — the piece's author hears about it.
      bump(comment.piece.authorId, comment, "comment");
    } else {
      // Reply — everyone already in the thread hears about it, which is how
      // the thread starter and earlier repliers both stay in the loop.
      const participants = threadParticipants.get(comment.parentId);
      if (!participants) continue;
      for (const participantId of participants) {
        bump(participantId, comment, "reply");
      }
    }
  }

  // Resolve emails and honour the notification preference in one pass.
  const recipients = await prisma.user.findMany({
    where: { id: { in: [...recipientIds] }, emailNotifications: true },
    select: { id: true, email: true },
  });
  const emailById = new Map(recipients.map((user) => [user.id, user.email]));

  const baseUrl = process.env.NEXTAUTH_URL || "https://letsriff.app";
  let emailsSent = 0;
  const pieceIds = new Set<string>();

  for (const group of groups.values()) {
    const email = emailById.get(group.recipientId);
    if (!email) continue;

    // Mirrors the bell's deep link (NotificationItem.getLink) — notify=1 opens
    // the read page with the conversation already showing.
    const params = new URLSearchParams();
    if (group.riffId) params.set("riff", group.riffId);
    params.set("notify", "1");

    await sendCommentNotificationEmail({
      email,
      pieceTitle: group.pieceTitle,
      commentCount: group.commentCount,
      replyCount: group.replyCount,
      pieceUrl: `${baseUrl}/read/${group.pieceId}?${params.toString()}`,
    });
    pieceIds.add(group.pieceId);
    emailsSent++;
  }

  return { emailsSent, piecesWithComments: pieceIds.size };
}
