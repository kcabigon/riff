import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getContentPreview } from "@/lib/riff-utils";
import MyRiffsClient from "./MyRiffsClient";

export const metadata: Metadata = {
  title: "Riffs",
};

export default async function MyRiffsPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [participations, userClubs, user, clubmates, riffmates, pieces] =
    await Promise.all([
      prisma.riffParticipant.findMany({
        where: { userId },
        include: {
          riff: {
            include: {
              club: { select: { id: true, name: true, bannerImage: true } },
              participants: {
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
                    },
                  },
                },
              },
            },
          },
        },
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
      // Friends — anyone who shares a (non-archived) club with you.
      prisma.clubMember.findMany({
        where: {
          club: { members: { some: { userId } }, isArchived: false },
          userId: { not: userId },
        },
        select: {
          user: {
            select: { id: true, name: true, username: true, avatarUrl: true },
          },
        },
        distinct: ["userId"],
      }),
      // Friends — anyone who's participated in a riff with you (covers people
      // you've written alongside even if you're no longer in the same club).
      prisma.riffParticipant.findMany({
        where: {
          riff: { participants: { some: { userId } } },
          userId: { not: userId },
        },
        select: {
          user: {
            select: { id: true, name: true, username: true, avatarUrl: true },
          },
        },
        distinct: ["userId"],
      }),
      // Pieces the user has authored — powers the Drafts and Pieces sections.
      prisma.piece.findMany({
        where: { authorId: userId },
        select: {
          id: true,
          title: true,
          coverImage: true,
          currentContent: true,
          wordCount: true,
          createdAt: true,
          updatedAt: true,
          riffs: {
            select: {
              submittedAt: true,
              riff: {
                select: {
                  id: true,
                  title: true,
                  volumeNumber: true,
                  status: true,
                  deadline: true,
                  club: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

  if (!user) redirect("/login");

  const riffs = participations.map((p) => p.riff);
  const riffIds = riffs.map((r) => r.id);

  // For active riffs, compute predictedVolumeNumber per club (count of REVEALED+COMPLETED riffs + 1)
  const activeClubIds = [
    ...new Set([
      ...riffs.filter((r) => r.status === "ACTIVE").map((r) => r.clubId),
      ...pieces
        .flatMap((p) => p.riffs)
        .filter((pr) => pr.riff.status === "ACTIVE")
        .map((pr) => pr.riff.club.id),
    ]),
  ];

  const [pieceReads, volumeCounts] = await Promise.all([
    riffIds.length > 0
      ? prisma.pieceRead.findMany({
          where: { userId, riffId: { in: riffIds } },
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
  ]);

  const readCounts: Record<string, number> = {};
  const readPieceIds = new Set<string>();
  for (const read of pieceReads) {
    readCounts[read.riffId] = (readCounts[read.riffId] || 0) + 1;
    readPieceIds.add(read.pieceId);
  }

  // Friends with an unread piece — a submitted piece in a revealed riff,
  // authored by someone else, that this user hasn't opened yet. Powers the
  // green unread ring on the Friends row. Only covers riff-bound pieces
  // since PieceRead requires a riffId; standalone (non-riff) pieces can't
  // be tracked here until that column is made optional.
  const friendIdsWithUnread = new Set<string>();
  for (const riff of riffs) {
    if (riff.status !== "REVEALED") continue;
    for (const p of riff.pieces) {
      if (p.submittedAt === null) continue;
      if (p.piece.authorId === userId) continue;
      if (!readPieceIds.has(p.piece.id)) {
        friendIdsWithUnread.add(p.piece.authorId);
      }
    }
  }

  // Latest submission timestamp per friend, across all shared riffs — used
  // to rank the Friends row by recent activity once unread friends are
  // pinned first.
  const latestPieceAtByFriend = new Map<string, Date>();
  for (const riff of riffs) {
    for (const p of riff.pieces) {
      if (p.submittedAt === null) continue;
      if (p.piece.authorId === userId) continue;
      const submittedAt = new Date(p.submittedAt);
      const existing = latestPieceAtByFriend.get(p.piece.authorId);
      if (!existing || submittedAt > existing) {
        latestPieceAtByFriend.set(p.piece.authorId, submittedAt);
      }
    }
  }

  const predictedVolumeByClub: Record<string, number> = {};
  for (const clubId of activeClubIds) {
    predictedVolumeByClub[clubId] = 1;
  }
  for (const row of volumeCounts) {
    predictedVolumeByClub[row.clubId] = row._count.id + 1;
  }

  const currentClub =
    userClubs.find((c) => c.id === user.lastActiveClubId) ??
    userClubs[0] ??
    null;

  // Dedupe clubmates + riffmates into a single friends list.
  const friendsById = new Map<
    string,
    {
      id: string;
      name: string | null;
      username: string | null;
      avatarUrl: string | null;
    }
  >();
  for (const { user: friend } of [...clubmates, ...riffmates]) {
    friendsById.set(friend.id, friend);
  }
  // Unread friends first, then by most recent submission, alphabetical as
  // the final tiebreaker.
  const rankedFriends = Array.from(friendsById.values())
    .map((friend) => ({
      friend,
      hasUnread: friendIdsWithUnread.has(friend.id),
      lastActivityAt: latestPieceAtByFriend.get(friend.id) ?? null,
    }))
    .sort((a, b) => {
      if (a.hasUnread !== b.hasUnread) return a.hasUnread ? -1 : 1;
      if (a.lastActivityAt && b.lastActivityAt) {
        return b.lastActivityAt.getTime() - a.lastActivityAt.getTime();
      }
      if (a.lastActivityAt || b.lastActivityAt) {
        return a.lastActivityAt ? -1 : 1;
      }
      return (a.friend.name || a.friend.username || "").localeCompare(
        b.friend.name || b.friend.username || ""
      );
    });
  const friends = rankedFriends.map(({ friend, hasUnread }) => ({
    ...friend,
    hasUnread,
  }));

  const serializedRiffs = riffs.map((r) => ({
    id: r.id,
    title: r.title,
    volumeNumber: r.volumeNumber,
    status: r.status,
    prompt: r.prompt,
    deadline: r.deadline ? r.deadline.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    club: r.club,
    participants: r.participants,
    pieces: r.pieces.map((p) => ({
      submittedAt: p.submittedAt ? p.submittedAt.toISOString() : null,
      piece: p.piece,
    })),
  }));

  const serializedPieces = pieces.map((p) => ({
    id: p.id,
    title: p.title,
    coverImage: p.coverImage,
    preview: getContentPreview(p.currentContent, 500),
    wordCount: p.wordCount,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    riffs: p.riffs.map((pr) => ({
      submittedAt: pr.submittedAt ? pr.submittedAt.toISOString() : null,
      riff: {
        ...pr.riff,
        deadline: pr.riff.deadline ? pr.riff.deadline.toISOString() : null,
      },
    })),
  }));

  return (
    <MyRiffsClient
      user={user}
      userClubs={userClubs}
      currentClub={currentClub}
      riffs={serializedRiffs}
      currentUserId={userId}
      readCounts={readCounts}
      predictedVolumeByClub={predictedVolumeByClub}
      friends={friends}
      pieces={serializedPieces}
    />
  );
}
