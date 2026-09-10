import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import RiffPageLayout from "@/components/riffs/RiffPageLayout";
import { getSubmittedPieces, getContentPreview } from "@/lib/riff-utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const riff = await prisma.riff.findUnique({
    where: { id },
    select: { club: { select: { name: true } } },
  });
  return {
    title: riff?.club?.name ?? "Riff",
    description: `Read the pieces from this riff on Riff.`,
  };
}

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

  // Fetch user profile, all their clubs (for nav), and whether they have any
  // standalone draft (for the Attach Draft option) in parallel
  const [navUser, userClubs, standaloneDraftCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, username: true, avatarUrl: true },
    }),
    prisma.club.findMany({
      where: { members: { some: { userId } }, isArchived: false },
      select: { id: true, name: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.piece.count({
      where: { authorId: userId, riffs: { none: {} }, publishedAt: null },
    }),
  ]);
  const hasStandaloneDrafts = standaloneDraftCount > 0;

  // Fetch riff with full data
  const riff = await prisma.riff.findUnique({
    where: { id },
    include: {
      club: {
        select: {
          id: true,
          name: true,
          adminId: true,
          moderatorId: true,
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

  // Verify user is a club member OR a riff participant + predicted volume number in parallel
  // (clubless riffs have no members to check and no per-club volume sequence)
  const [member, predictedVolumeNumber] = await Promise.all([
    riff.clubId
      ? prisma.clubMember.findFirst({
          where: { clubId: riff.clubId, userId },
        })
      : Promise.resolve(null),
    riff.status === "ACTIVE" && riff.clubId
      ? prisma.riff
          .count({
            where: {
              clubId: riff.clubId,
              status: { in: ["REVEALED", "COMPLETED"] },
            },
          })
          .then((n) => n + 1)
      : Promise.resolve(undefined),
  ]);

  const isJoined = riff.participants.some((p) => p.user.id === userId);

  if (!member && !isJoined) {
    redirect("/");
  }
  const hasDraft = riff.pieces.some((p) => p.piece.authorId === userId);
  const hasSubmitted = riff.pieces.some(
    (p) => p.piece.authorId === userId && p.submittedAt !== null
  );
  // Clubless riffs have no admin — the creator holds host powers
  const isAdmin = riff.club
    ? riff.club.adminId === userId || riff.club.moderatorId === userId
    : riff.creatorId === userId;
  const canDeleteRiff =
    riff.club?.adminId === userId || riff.creatorId === userId;

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
    piecesToRead: number;
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

    // First reveal: no reads yet AND user participated — non-participants (including
    // new members browsing past riffs) should not see the "moment you've been waiting for" modal
    isFirstReveal = !isAdmin && reads.length === 0 && isJoined;

    // Fetch all comment timestamps for this riff in one query
    // Exclude the current user's own comments — leaving a comment shouldn't
    // trigger a "New" badge on your own piece
    const comments = await prisma.comment.findMany({
      where: { riffId: id, authorId: { not: userId } },
      select: { pieceId: true, createdAt: true },
    });

    // For each piece the user has read, check if any comment is newer than readAt
    for (const { pieceId: pid, readAt } of reads) {
      hasNewCommentsMap[pid] = comments.some(
        (c) => c.pieceId === pid && c.createdAt > readAt
      );
    }

    // Contribution strip data — club members for club riffs, participants for clubless
    const clubMembers = riff.clubId
      ? await prisma.clubMember.findMany({
          where: { clubId: riff.clubId },
          select: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        })
      : riff.participants.map((p) => ({
          user: {
            id: p.user.id,
            name: p.user.name,
            avatarUrl: p.user.avatarUrl,
          },
        }));

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

    // Own pieces never get a PieceRead row from normal viewing, so a piece's
    // author can never reach a full ring against the riff-wide total. Shrink
    // their personal denominator by 1 instead of inflating the numerator —
    // "have you read everyone else's piece" rather than "did you read your
    // own too", which needs no synthetic read-row bookkeeping.
    const submittedPieces = getSubmittedPieces(riff.pieces);
    const submittedPieceAuthorIds = new Set(
      submittedPieces.map((p) => p.piece.authorId)
    );

    contributionData = clubMembers
      .map((m) => ({
        user: m.user,
        readCount: readCountMap[m.user.id] ?? 0,
        commentCount: commentCountMap[m.user.id] ?? 0,
        piecesToRead: Math.max(
          submittedPieces.length -
            (submittedPieceAuthorIds.has(m.user.id) ? 1 : 0),
          0
        ),
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
          // Plain-text preview — only computed (and only sent) for the
          // viewer's own unsubmitted piece, same privacy rule as the club
          // page: other participants' previews are faked client-side from
          // wordCount alone (see ProgressCard's blurredPreviewFiller).
          preview:
            pr.piece.authorId === userId
              ? getContentPreview(pr.piece.currentContent, 500)
              : "",
        },
      })),
  };

  return (
    <RiffPageLayout
      riff={serializedRiff}
      currentUserId={userId}
      isAdmin={isAdmin}
      canDeleteRiff={canDeleteRiff}
      isJoined={isJoined}
      hasDraft={hasDraft}
      hasSubmitted={hasSubmitted}
      draftPieceId={draftPieceId}
      readPieceIds={readPieceIds}
      hasNewCommentsMap={hasNewCommentsMap}
      contributionData={contributionData}
      totalPieces={getSubmittedPieces(riff.pieces).length}
      navUser={
        navUser ?? { id: userId, name: null, username: null, avatarUrl: null }
      }
      userClubs={userClubs}
      hostFirstName={riff.club?.admin?.firstName ?? null}
      isFirstReveal={isFirstReveal}
      predictedVolumeNumber={predictedVolumeNumber}
      hasStandaloneDrafts={hasStandaloneDrafts}
    />
  );
}
