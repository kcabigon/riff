import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import RiffPageLayout from "@/components/riffs/RiffPageLayout";
import {
  getSubmittedPieces,
  getContentPreview,
  isAuthoredBy,
  type RiffContributor,
} from "@/lib/riff-utils";

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

  // The club page's Current Riff section already has full feature parity
  // with this page's pre-reveal view — send club riffs there instead once
  // they exist, so there's one home for a riff while it's being written,
  // not two. Clubless riffs have no club page to fall back to, so they
  // always render here regardless of status. Club access control is left
  // to /clubs/[id]/page.tsx itself, not duplicated here.
  if (
    riff.clubId &&
    riff.status !== "REVEALED" &&
    riff.status !== "COMPLETED"
  ) {
    redirect(`/clubs/${riff.clubId}`);
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

  // Computed once, reused for both the header's totalPieces prop and the
  // Read-by ring denominators below — same filter, one source of truth.
  const submittedPieces = getSubmittedPieces(riff.pieces);

  // Fetch read data and compute per-piece flags for REVEALED riffs
  let readPieceIds: string[] = [];
  let isFirstReveal = false;
  const hasNewCommentsMap: Record<string, boolean> = {};
  let contributionData: RiffContributor[] = [];
  if (riff.status === "REVEALED") {
    // One PieceRead fetch for the whole riff — derives both the viewer's
    // own per-piece readAt map and every member's total read count, instead
    // of a separate findMany + groupBy round-trip for each.
    const allReads = await prisma.pieceRead.findMany({
      where: { riffId: id },
      select: { userId: true, pieceId: true, readAt: true },
    });
    const reads = allReads.filter((r) => r.userId === userId);
    const readCountMap: Record<string, number> = {};
    for (const r of allReads) {
      readCountMap[r.userId] = (readCountMap[r.userId] ?? 0) + 1;
    }

    // Own pieces always treated as read — no Unread badge on your own work
    const ownPieceIds = riff.pieces
      .filter((p) => isAuthoredBy(p.piece, userId))
      .map((p) => p.piece.id);
    readPieceIds = [
      ...new Set([...reads.map((r) => r.pieceId), ...ownPieceIds]),
    ];

    // First reveal: no reads yet AND user participated — non-participants (including
    // new members browsing past riffs) should not see the "moment you've been waiting for" modal
    isFirstReveal = !isAdmin && reads.length === 0 && isJoined;

    // One Comment fetch for the whole riff — derives both the "new since
    // you last read it" flags and every author's total comment count.
    const allComments = await prisma.comment.findMany({
      where: { riffId: id },
      select: { pieceId: true, createdAt: true, authorId: true },
    });
    const commentCountMap: Record<string, number> = {};
    for (const c of allComments) {
      commentCountMap[c.authorId] = (commentCountMap[c.authorId] ?? 0) + 1;
    }

    // For each piece the user has read, check if any comment is newer than
    // readAt — excludes the viewer's own comments, since leaving one
    // shouldn't trigger a "New" badge on your own piece.
    for (const { pieceId: pid, readAt } of reads) {
      hasNewCommentsMap[pid] = allComments.some(
        (c) =>
          c.authorId !== userId && c.pieceId === pid && c.createdAt > readAt
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

    // Own pieces never get a PieceRead row from normal viewing, so a piece's
    // author can never reach a full ring against the riff-wide total. Shrink
    // their personal denominator by 1 instead of inflating the numerator —
    // "have you read everyone else's piece" rather than "did you read your
    // own too", which needs no synthetic read-row bookkeeping.
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
      totalPieces={submittedPieces.length}
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
