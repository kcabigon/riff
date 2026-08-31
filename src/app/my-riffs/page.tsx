import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getContentPreview } from "@/lib/riff-utils";
import { getFriends } from "@/lib/friends";
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

  const [participations, userClubs, user, rawFriends, pieces, joinableRiffs] =
    await Promise.all([
      prisma.riffParticipant.findMany({
        where: { userId },
        include: {
          riff: {
            include: {
              club: {
                select: {
                  id: true,
                  name: true,
                  bannerImage: true,
                  adminId: true,
                  moderatorId: true,
                },
              },
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
      // Friends — clubmates in active clubs, unioned with riffmates (covers
      // people you've written alongside even if you're no longer in the same club).
      getFriends(userId),
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
          publishedAt: true,
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
          newShares: {
            where: { shareType: "PUBLIC" },
            select: { id: true },
            take: 1,
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      // Active riffs in the user's clubs they haven't joined yet — powers
      // the "join" CTA in the Current Riffs section.
      prisma.riff.findMany({
        where: {
          status: "ACTIVE",
          club: { members: { some: { userId } }, isArchived: false },
          participants: { none: { userId } },
        },
        include: {
          club: {
            select: {
              id: true,
              name: true,
              bannerImage: true,
              adminId: true,
              moderatorId: true,
            },
          },
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
      }),
    ]);

  if (!user) redirect("/login");

  const riffs = participations.map((p) => p.riff);
  const riffIds = riffs.map((r) => r.id);

  const friendIds = rawFriends.map((f) => f.id);

  // For active riffs, compute predictedVolumeNumber per club (count of REVEALED+COMPLETED riffs + 1)
  const activeClubIds = [
    ...new Set([
      ...riffs.filter((r) => r.status === "ACTIVE").map((r) => r.clubId),
      ...pieces
        .flatMap((p) => p.riffs)
        .filter((pr) => pr.riff.status === "ACTIVE")
        .map((pr) => pr.riff.club.id),
      ...joinableRiffs.map((r) => r.clubId),
    ]),
  ];

  // Own pieces are excluded from read counts — a riff is "fully read" when
  // every *other* participant's piece has been read. Viewing your own piece
  // creates a PieceRead record too, which would otherwise inflate the count
  // and prematurely move the riff to Past Riffs. Mirrors the club page.
  const ownPieceIds = riffs.flatMap((r) =>
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
    predictedVolumeByClub[row.clubId] = row._count.id + 1;
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

  const serializedJoinableRiffs = joinableRiffs.map((r) => ({
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
    publishedAt: p.publishedAt ? p.publishedAt.toISOString() : null,
    riffs: p.riffs.map((pr) => ({
      submittedAt: pr.submittedAt ? pr.submittedAt.toISOString() : null,
      riff: {
        ...pr.riff,
        deadline: pr.riff.deadline ? pr.riff.deadline.toISOString() : null,
      },
    })),
    isPublic: p.newShares.length > 0,
    publicShareId: p.newShares[0]?.id ?? null,
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
      joinableRiffs={serializedJoinableRiffs}
    />
  );
}
