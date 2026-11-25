import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import ClubPageLayout from "@/components/clubs/ClubPageLayout";
import {
  getSubmittedPieces,
  getTotalWordCount,
  getContentPreview,
  isAuthoredBy,
} from "@/lib/riff-utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const club = await prisma.club.findUnique({
    where: { id },
    select: { name: true },
  });
  return {
    title: club?.name ?? "Club",
    description: `Read and write with your club on Riff.`,
  };
}

export default async function ClubPage({
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

  // Everything the page needs, in one round trip: the club (filtered to clubs
  // the user is a member of; null means not a member), the clubs dropdown,
  // riffs, whether the user has any standalone draft (for the Attach Draft
  // option), the viewer's own piece content (for their draft preview), and
  // the viewer's reads plus all comments on this club's revealed/completed
  // riffs (read progress, Unread badges, comment counts). Each query filters
  // by club ID directly so none has to wait for another.
  const [
    club,
    userClubs,
    riffs,
    standaloneDraftCount,
    ownPieceContents,
    pastReads,
    pastComments,
  ] = await Promise.all([
    prisma.club.findFirst({
      where: { id, members: { some: { userId } }, isArchived: false },
      select: {
        id: true,
        name: true,
        description: true,
        bannerImage: true,
        cadence: true,
        adminId: true,
        moderatorId: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
      },
    }),
    prisma.club.findMany({
      where: {
        members: { some: { userId } },
        isArchived: false,
      },
      select: { id: true, name: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.riff.findMany({
      where: { clubId: id },
      include: {
        creator: {
          select: { id: true, name: true, username: true, avatarUrl: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, username: true, avatarUrl: true },
            },
          },
        },
        pieces: {
          include: {
            piece: {
              select: {
                id: true,
                title: true,
                authorId: true,
                coverImage: true,
                wordCount: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
          orderBy: { id: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.piece.count({
      where: { authorId: userId, riffs: { none: {} }, publishedAt: null },
    }),
    // Full Tiptap content only for the viewer's own pieces in this club —
    // pulling every member's essay content just to build the viewer's own
    // preview would be wasted DB I/O.
    prisma.piece.findMany({
      where: { authorId: userId, riffs: { some: { riff: { clubId: id } } } },
      select: { id: true, currentContent: true },
    }),
    prisma.pieceRead.findMany({
      where: {
        userId,
        riff: { clubId: id, status: { in: ["REVEALED", "COMPLETED"] } },
      },
      select: { riffId: true, pieceId: true, readAt: true },
    }),
    prisma.comment.findMany({
      where: {
        riff: { clubId: id, status: { in: ["REVEALED", "COMPLETED"] } },
      },
      select: {
        riffId: true,
        pieceId: true,
        createdAt: true,
        authorId: true,
      },
    }),
  ]);
  const hasStandaloneDrafts = standaloneDraftCount > 0;

  if (!club) {
    // Club is archived or user is not a member — find another active club
    const anyMembership = await prisma.clubMember.findFirst({
      where: { userId, club: { isArchived: false } },
      include: { club: { select: { id: true } } },
    });

    if (anyMembership) {
      redirect(`/clubs/${anyMembership.club.id}`);
    }

    redirect("/home");
  }

  // joinedAt is available from the members list already fetched above
  const memberJoinedAt = club.members.find(
    (m) => m.userId === userId
  )!.joinedAt;

  const ownPieceContentById = new Map(
    ownPieceContents.map((p) => [p.id, p.currentContent])
  );

  // Compute stats
  const riffCount = riffs.length;
  const pieceCount = riffs.reduce(
    (sum, r) => sum + getSubmittedPieces(r.pieces).length,
    0
  );
  const wordCount = riffs.reduce(
    (sum, r) => sum + getTotalWordCount(getSubmittedPieces(r.pieces)),
    0
  );

  // Serialize dates to strings for client component boundary (Prisma returns Date objects).
  // Preview text (stripped of HTML, truncated to 500 chars) is only computed
  // for the viewer's own piece — it's rendered as-is in their own draft card.
  // Other participants' in-progress previews are faked client-side from
  // wordCount alone (see ProgressCard's blurredPreviewFiller), so no other
  // piece's content — full or truncated — is ever shipped pre-reveal.
  const serializeRiff = (r: (typeof riffs)[0]) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    deadline: r.deadline ? r.deadline.toISOString() : null,
    pieces: r.pieces.map((pr) => ({
      ...pr,
      submittedAt: pr.submittedAt ? pr.submittedAt.toISOString() : null,
      piece: {
        id: pr.piece.id,
        title: pr.piece.title,
        authorId: pr.piece.authorId,
        coverImage: pr.piece.coverImage,
        wordCount: pr.piece.wordCount,
        createdAt: pr.piece.createdAt.toISOString(),
        updatedAt: pr.piece.updatedAt.toISOString(),
        preview:
          pr.piece.authorId === userId
            ? getContentPreview(ownPieceContentById.get(pr.piece.id) ?? "", 500)
            : "",
      },
    })),
  });

  // Separate riffs by status
  // Revealed riffs are split by membership join date:
  // - post-join revealed riffs → "Current Read" (member was present for these)
  // - pre-join revealed riffs → "Past Riffs" (member joined after these revealed)
  const activeRiff = riffs.find((r) => r.status === "ACTIVE")
    ? serializeRiff(riffs.find((r) => r.status === "ACTIVE")!)
    : null;

  // Only meaningful when there's an active riff — same count used at reveal time
  const predictedVolumeNumber = activeRiff
    ? riffs.filter((r) => r.status === "REVEALED" || r.status === "COMPLETED")
        .length + 1
    : undefined;
  const revealedRiffs = riffs
    .filter((r) => r.status === "REVEALED" && r.updatedAt > memberJoinedAt)
    .map(serializeRiff);
  const pastRevealedRiffs = riffs
    .filter((r) => r.status === "REVEALED" && r.updatedAt <= memberJoinedAt)
    .map(serializeRiff);
  const completedRiffs = riffs
    .filter((r) => r.status === "COMPLETED")
    .map(serializeRiff);

  // Fetch read counts for post-join revealed riffs only (per-user).
  // Own pieces are excluded from both the read count and the total — a riff is
  // "fully read" when every *other* participant's piece has been read. This avoids
  // double-counting: navigating to your own piece creates a PieceRead record, which
  // would collide with the old +1 hack and prematurely move the riff to Past Riffs.
  const revealedRiffIds = revealedRiffs.map((r) => r.id);
  let readCounts: Record<string, number> = {};
  // Per-piece read state — needed for the "Unread" badge on individual piece
  // cards in the Current Read grid (readCounts above is riff-level only).
  let readPieceIds: string[] = [];
  if (revealedRiffIds.length > 0) {
    const ownPieceIds = revealedRiffs.flatMap((r) =>
      r.pieces
        .filter((p) => p.piece.authorId === userId && p.submittedAt !== null)
        .map((p) => p.piece.id)
    );
    // Already fetched with the past reads above; keep just these riffs.
    const reads = pastReads.filter((r) => revealedRiffIds.includes(r.riffId));
    readPieceIds = reads.map((r) => r.pieceId);
    const countableReads =
      ownPieceIds.length > 0
        ? reads.filter((r) => !ownPieceIds.includes(r.pieceId))
        : reads;
    readCounts = countableReads.reduce<Record<string, number>>((acc, r) => {
      acc[r.riffId] = (acc[r.riffId] || 0) + 1;
      return acc;
    }, {});
  }

  // New comment activity for Past Riffs — batched across every riff that
  // can end up there (COMPLETED + pre-join REVEALED + post-join REVEALED,
  // since the final Past Riffs list is a client-side union and we don't
  // know which subset of post-join revealed riffs will migrate in until
  // isFullyReadForUser runs client-side). Same PieceRead(readAt) + Comment
  // compare-and-count mechanic as hasNewCommentsMap in
  // src/app/riffs/[id]/page.tsx, aggregated per-riff instead of per-piece.
  // New comment activity for Past Riffs, across every riff that can end up
  // there (COMPLETED + pre-join REVEALED + post-join REVEALED, since the final
  // Past Riffs list is a client-side union and we don't know which post-join
  // revealed riffs will migrate in until isFullyReadForUser runs client-side).
  // Same PieceRead(readAt) + Comment compare-and-count mechanic as
  // hasNewCommentsMap in src/app/riffs/[id]/page.tsx, aggregated per-riff.
  // pastReads/pastComments cover exactly those riffs (this club's REVEALED
  // and COMPLETED riffs), fetched in the first round trip.
  const readAtByPiece = new Map(pastReads.map((r) => [r.pieceId, r.readAt]));
  const newCommentCounts = pastComments.reduce<Record<string, number>>(
    (acc, c) => {
      if (isAuthoredBy(c, userId)) return acc;
      const readAt = readAtByPiece.get(c.pieceId);
      if (readAt && c.riffId && c.createdAt > readAt) {
        acc[c.riffId] = (acc[c.riffId] || 0) + 1;
      }
      return acc;
    },
    {}
  );
  // Every comment on the riff, own included — Current Read's metadata line,
  // matching the riff page's Comments (N) total. Tallied from the same rows.
  const commentCounts = pastComments.reduce<Record<string, number>>(
    (acc, c) => {
      if (c.riffId) acc[c.riffId] = (acc[c.riffId] || 0) + 1;
      return acc;
    },
    {}
  );

  const isAdmin = club.adminId === userId;

  // Update lastActiveClubId (fire-and-forget, non-blocking)
  prisma.user
    .update({
      where: { id: userId },
      data: { lastActiveClubId: id },
    })
    .catch(() => {});

  return (
    <ClubPageLayout
      club={club}
      userClubs={userClubs}
      currentUserId={userId}
      isAdmin={isAdmin}
      activeRiff={activeRiff}
      revealedRiffs={revealedRiffs}
      pastRevealedRiffs={pastRevealedRiffs}
      readCounts={readCounts}
      readPieceIds={readPieceIds}
      newCommentCounts={newCommentCounts}
      commentCounts={commentCounts}
      completedRiffs={completedRiffs}
      stats={{ riffCount, pieceCount, wordCount }}
      predictedVolumeNumber={predictedVolumeNumber}
      hasStandaloneDrafts={hasStandaloneDrafts}
    />
  );
}
