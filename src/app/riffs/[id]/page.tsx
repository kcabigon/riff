import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import RiffPageLayout from "@/components/riffs/RiffPageLayout";
import { getSubmittedPieces } from "@/lib/riff-utils";

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

  // Fetch user profile and all their clubs in parallel (for nav)
  const [navUser, userClubs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, username: true, avatarUrl: true },
    }),
    prisma.club.findMany({
      where: { members: { some: { userId } }, isArchived: false },
      select: { id: true, name: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  // Fetch riff with full data
  const riff = await prisma.riff.findUnique({
    where: { id },
    include: {
      club: {
        select: {
          id: true,
          name: true,
          adminId: true,
          admin: { select: { firstName: true } },
        },
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
  // ID of the user's unsubmitted piece — needed for late submission on revealed riffs
  const draftPieceId =
    riff.pieces.find(
      (p) => p.piece.authorId === userId && p.submittedAt === null
    )?.piece.id ?? null;

  // Fetch read data and compute per-piece flags for REVEALED riffs
  let readPieceIds: string[] = [];
  let isFirstReveal = false;
  const hasNewCommentsMap: Record<string, boolean> = {};
  let contributionData: Array<{
    user: { id: string; name: string | null; avatarUrl: string | null };
    readCount: number;
    commentCount: number;
  }> = [];
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

    // First reveal: no actual DB reads yet (own piece auto-inclusion doesn't count)
    isFirstReveal = !isAdmin && reads.length === 0;

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

    // Contribution strip data
    const clubMembers = await prisma.clubMember.findMany({
      where: { clubId: riff.clubId },
      select: { user: { select: { id: true, name: true, avatarUrl: true } } },
    });

    const readGroups = await prisma.pieceRead.groupBy({
      by: ["userId"],
      where: { riffId: id },
      _count: { pieceId: true },
    });

    const commentGroups = await prisma.comment.groupBy({
      by: ["authorId"],
      where: { riffId: id },
      _count: { id: true },
    });

    const readCountMap: Record<string, number> = Object.fromEntries(
      readGroups.map((g) => [g.userId, g._count.pieceId])
    );
    const commentCountMap: Record<string, number> = Object.fromEntries(
      commentGroups.map((g) => [g.authorId, g._count.id])
    );

    contributionData = clubMembers
      .map((m) => ({
        user: m.user,
        readCount: readCountMap[m.user.id] ?? 0,
        commentCount: commentCountMap[m.user.id] ?? 0,
      }))
      .filter((m) => m.readCount >= 1)
      .sort((a, b) =>
        b.readCount !== a.readCount
          ? b.readCount - a.readCount
          : b.commentCount - a.commentCount
      );
  }

  // Serialize dates to strings for client component boundary (Prisma returns Date objects)
  const isRevealed = riff.status === "REVEALED";

  const serializedRiff = {
    ...riff,
    createdAt: riff.createdAt.toISOString(),
    updatedAt: riff.updatedAt.toISOString(),
    deadline: riff.deadline ? riff.deadline.toISOString() : null,
    pieces: riff.pieces
      .filter((pr) => (isRevealed ? pr.submittedAt !== null : true))
      .map((pr) => ({
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
      draftPieceId={draftPieceId}
      readPieceIds={readPieceIds}
      hasNewCommentsMap={hasNewCommentsMap}
      contributionData={contributionData}
      totalPieces={getSubmittedPieces(riff.pieces).length}
      navUser={navUser}
      userClubs={userClubs}
      hostFirstName={riff.club.admin?.firstName ?? null}
      isFirstReveal={isFirstReveal}
    />
  );
}
