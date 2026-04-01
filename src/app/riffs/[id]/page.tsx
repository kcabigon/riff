import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import RiffPageLayout from "@/components/riffs/RiffPageLayout";

export default async function RiffPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Fetch riff with full data
  const riff = await prisma.riff.findUnique({
    where: { id },
    include: {
      club: {
        select: { id: true, name: true, adminId: true },
      },
      creator: {
        select: { id: true, name: true, username: true, avatarUrl: true },
      },
      participants: {
        include: {
          user: {
            select: { id: true, name: true, username: true, avatarUrl: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      pieces: {
        include: {
          piece: {
            select: {
              id: true,
              title: true,
              authorId: true,
              wordCount: true,
              coverImage: true,
              currentContent: true,
              updatedAt: true,
              author: {
                select: { id: true, name: true, avatarUrl: true },
              },
              _count: {
                select: {
                  comments: {
                    where: { riffId: id },
                  },
                },
              },
            },
          },
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!riff) {
    redirect("/");
  }

  // Verify user is a club member
  const member = await prisma.clubMember.findFirst({
    where: {
      clubId: riff.clubId,
      userId,
    },
  });

  if (!member) {
    redirect("/");
  }

  const isJoined = riff.participants.some((p) => p.user.id === userId);
  const hasDraft = riff.pieces.some((p) => p.piece.authorId === userId);
  const hasSubmitted = riff.pieces.some(
    (p) => p.piece.authorId === userId && p.submittedAt !== null
  );
  const isAdmin = riff.club.adminId === userId;

  // Fetch read data and compute per-piece flags for REVEALED riffs
  let readPieceIds: string[] = [];
  const hasNewCommentsMap: Record<string, boolean> = {};
  if (riff.status === "REVEALED") {
    // Fetch read records with readAt timestamps
    const reads = await prisma.pieceRead.findMany({
      where: { userId, riffId: id },
      select: { pieceId: true, readAt: true },
    });
    const readAtMap: Record<string, Date> = Object.fromEntries(
      reads.map((r) => [r.pieceId, r.readAt])
    );

    // Own pieces always treated as read — no Unread badge on your own work
    const ownPieceIds = riff.pieces
      .filter((p) => p.piece.authorId === userId)
      .map((p) => p.piece.id);
    readPieceIds = [
      ...new Set([...reads.map((r) => r.pieceId), ...ownPieceIds]),
    ];

    // Fetch all comment timestamps for this riff in one query
    const comments = await prisma.comment.findMany({
      where: { riffId: id },
      select: { pieceId: true, createdAt: true },
    });

    // For each piece the user has read, check if any comment is newer than readAt
    for (const { pieceId: pid, readAt } of reads) {
      hasNewCommentsMap[pid] = comments.some(
        (c) => c.pieceId === pid && c.createdAt > readAt
      );
    }
  }

  // Serialize dates to strings for client component boundary (Prisma returns Date objects)
  const isRevealed = riff.status === "REVEALED";

  const serializedRiff = {
    ...riff,
    createdAt: riff.createdAt.toISOString(),
    deadline: riff.deadline ? riff.deadline.toISOString() : null,
    pieces: riff.pieces.map((pr) => ({
      ...pr,
      submittedAt: pr.submittedAt ? pr.submittedAt.toISOString() : null,
      piece: {
        ...pr.piece,
        // Strip content before reveal — cover image still returned for locked card teaser
        currentContent: isRevealed ? pr.piece.currentContent : null,
        updatedAt: pr.piece.updatedAt.toISOString(),
        commentCount: pr.piece._count?.comments ?? 0,
        _count: undefined,
      },
    })),
  };

  return (
    <RiffPageLayout
      riff={serializedRiff}
      currentUserId={userId}
      isAdmin={isAdmin}
      isJoined={isJoined}
      hasDraft={hasDraft}
      hasSubmitted={hasSubmitted}
      readPieceIds={readPieceIds}
      hasNewCommentsMap={hasNewCommentsMap}
    />
  );
}
