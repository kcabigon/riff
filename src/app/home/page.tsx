import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getFriends } from "@/lib/friends";
import {
  getPiecesPage,
  getCompletedRiffsPage,
  RIFF_INCLUDE,
  serializeRiff,
} from "@/lib/home-data";
import MyRiffsClient from "./MyRiffsClient";

// Matches MyRiffsClient's DRAFTS_CAP/PIECES_CAP/PAST_RIFFS_CAP — only this
// many of each are fetched up front; "View all" fetches the rest from
// /api/home/pieces and /api/home/past-riffs (see src/lib/home-data.ts).
const DRAFTS_CAP = 2;
const PIECES_CAP = 2;
const PAST_RIFFS_CAP = 2;

export default async function MyRiffsPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [
    participations,
    userClubs,
    user,
    rawFriends,
    draftsPage,
    submittedPage,
    pastRiffsPage,
    standaloneDraftCount,
    joinableRiffs,
  ] = await Promise.all([
    // ACTIVE + REVEALED only — this set stays naturally small (people tend
    // to read soon after reveal), so it's fetched in full. COMPLETED riffs
    // are the unbounded-growth bucket and are paginated separately below
    // (pastRiffsPage) — see the comment on getCompletedRiffsPage.
    prisma.riffParticipant.findMany({
      where: { userId, riff: { status: { not: "COMPLETED" } } },
      include: { riff: { include: RIFF_INCLUDE } },
    }),
    prisma.club.findMany({
      where: { members: { some: { userId } }, isArchived: false },
      select: { id: true, name: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
        lastActiveClubId: true,
      },
    }),
    // Friends — clubmates in active clubs, unioned with riffmates (covers
    // people you've written alongside even if you're no longer in the same club).
    getFriends(userId),
    // Drafts and Pieces sections — capped up front, "View all" fetches more.
    getPiecesPage(userId, "draft", { limit: DRAFTS_CAP }),
    getPiecesPage(userId, "submitted", { limit: PIECES_CAP }),
    getCompletedRiffsPage(userId, { limit: PAST_RIFFS_CAP }),
    // Whether the "Attach draft" option should show up on riff CTAs — needs
    // the user's *total* standalone-draft count, not just the capped page
    // above, so it's its own cheap count query (same pattern as
    // clubs/[id]/page.tsx and riffs/[id]/page.tsx).
    prisma.piece.count({
      where: { authorId: userId, riffs: { none: {} }, publishedAt: null },
    }),
    // Active riffs in the user's clubs they haven't joined yet — powers
    // the "join" CTA in the Current Riffs section.
    prisma.riff.findMany({
      where: {
        status: "ACTIVE",
        club: { members: { some: { userId } }, isArchived: false },
        participants: { none: { userId } },
      },
      include: RIFF_INCLUDE,
    }),
  ]);

  if (!user) redirect("/login");

  // Raw (non-serialized) — used for internal computation below, exactly
  // like the pre-pagination version of this page did. Only ACTIVE/REVEALED,
  // which is what every one of these computations actually needs (COMPLETED
  // riffs never factor into read counts or predicted volume numbers).
  const activeAndRevealedRiffs = participations.map((p) => p.riff);
  const riffIds = activeAndRevealedRiffs.map((r) => r.id);

  const friendIds = rawFriends.map((f) => f.id);

  const ownPieces = [...draftsPage.pieces, ...submittedPage.pieces];

  // For active riffs, compute predictedVolumeNumber per club (count of REVEALED+COMPLETED riffs + 1)
  // Clubless riffs are filtered out — they have no per-club volume sequence
  const activeClubIds = [
    ...new Set(
      [
        ...activeAndRevealedRiffs
          .filter((r) => r.status === "ACTIVE")
          .map((r) => r.clubId),
        ...ownPieces
          .flatMap((p) => p.riffs)
          .filter((pr) => pr.riff.status === "ACTIVE")
          .map((pr) => pr.riff.club?.id ?? null),
        ...joinableRiffs.map((r) => r.clubId),
      ].filter((id): id is string => id !== null)
    ),
  ];

  // Own pieces are excluded from read counts — a riff is "fully read" when
  // every *other* participant's piece has been read. Viewing your own piece
  // creates a PieceRead record too, which would otherwise inflate the count
  // and prematurely move the riff to Past Riffs. Mirrors the club page.
  const ownPieceIds = activeAndRevealedRiffs.flatMap((r) =>
    r.pieces
      .filter((p) => p.piece.authorId === userId && p.submittedAt !== null)
      .map((p) => p.piece.id)
  );

  const [pieceReads, volumeCounts, friendSubmissions] = await Promise.all([
    riffIds.length > 0
      ? prisma.pieceRead.findMany({
          where: {
            userId,
            riffId: { in: riffIds },
            ...(ownPieceIds.length > 0 && { pieceId: { notIn: ownPieceIds } }),
          },
          select: { riffId: true, pieceId: true },
        })
      : Promise.resolve([]),
    activeClubIds.length > 0
      ? prisma.riff.groupBy({
          by: ["clubId"],
          where: {
            clubId: { in: activeClubIds },
            status: { in: ["REVEALED", "COMPLETED"] },
          },
          _count: { id: true },
        })
      : Promise.resolve([]),
    // Every submission a friend has ever made, across any riff — not just
    // ones shared with the current user. Powers the Friends row as a
    // general "active friends" feed rather than only shared collaborators.
    friendIds.length > 0
      ? prisma.pieceRiff.findMany({
          where: {
            submittedAt: { not: null },
            piece: { authorId: { in: friendIds } },
          },
          select: {
            submittedAt: true,
            piece: { select: { authorId: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const readCounts: Record<string, number> = {};
  for (const read of pieceReads) {
    readCounts[read.riffId] = (readCounts[read.riffId] || 0) + 1;
  }

  // Latest submission timestamp per friend, across any riff they've
  // submitted to — used to rank the Friends row by overall recent activity.
  const latestPieceAtByFriend = new Map<string, Date>();
  for (const pr of friendSubmissions) {
    if (pr.submittedAt === null) continue;
    const submittedAt = new Date(pr.submittedAt);
    const existing = latestPieceAtByFriend.get(pr.piece.authorId);
    if (!existing || submittedAt > existing) {
      latestPieceAtByFriend.set(pr.piece.authorId, submittedAt);
    }
  }

  const predictedVolumeByClub: Record<string, number> = {};
  for (const clubId of activeClubIds) {
    predictedVolumeByClub[clubId] = 1;
  }
  for (const row of volumeCounts) {
    // clubId can't actually be null here (query is scoped to activeClubIds),
    // but the groupBy result type is nullable now
    if (row.clubId) predictedVolumeByClub[row.clubId] = row._count.id + 1;
  }

  const currentClub =
    userClubs.find((c) => c.id === user.lastActiveClubId) ??
    userClubs[0] ??
    null;

  // Most recent submission first (any riff), alphabetical as the fallback
  // for friends with no submissions at all.
  const friends = rawFriends
    .map((friend) => ({
      friend,
      lastActivityAt: latestPieceAtByFriend.get(friend.id) ?? null,
    }))
    .sort((a, b) => {
      if (a.lastActivityAt && b.lastActivityAt) {
        return b.lastActivityAt.getTime() - a.lastActivityAt.getTime();
      }
      if (a.lastActivityAt || b.lastActivityAt) {
        return a.lastActivityAt ? -1 : 1;
      }
      return (a.friend.name || a.friend.username || "").localeCompare(
        b.friend.name || b.friend.username || ""
      );
    })
    .map(({ friend }) => friend);

  const riffs = [
    ...activeAndRevealedRiffs.map(serializeRiff),
    ...pastRiffsPage.riffs,
  ];
  const serializedJoinableRiffs = joinableRiffs.map(serializeRiff);

  return (
    <MyRiffsClient
      user={user}
      userClubs={userClubs}
      currentClub={currentClub}
      riffs={riffs}
      currentUserId={userId}
      readCounts={readCounts}
      predictedVolumeByClub={predictedVolumeByClub}
      friends={friends}
      pieces={ownPieces}
      joinableRiffs={serializedJoinableRiffs}
      hasStandaloneDrafts={standaloneDraftCount > 0}
      hasMoreDrafts={draftsPage.hasMore}
      draftsCursor={draftsPage.nextCursor}
      hasMoreSubmitted={submittedPage.hasMore}
      submittedCursor={submittedPage.nextCursor}
      hasMorePastRiffs={pastRiffsPage.hasMore}
      pastRiffsCursor={pastRiffsPage.nextCursor}
    />
  );
}
