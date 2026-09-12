import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export type FriendSummary = {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
};

/**
 * Nested relation filter: "the User this is applied to is a friend of userId."
 * Friend = clubmate in an active (non-archived) club, riffmate (shared
 * RiffParticipant on any riff), or an accepted individual piece-invite
 * (Share.shareType "INDIVIDUAL", either direction — joining a piece grants
 * mutual friendship with its author, not just access to that one piece).
 * Meant to be embedded inside an existing query (e.g. `piece: { author: friendOfWhere(userId) }`)
 * so the check compiles into one round trip instead of a separate lookup.
 */
export function friendOfWhere(userId: string): Prisma.UserWhereInput {
  return {
    OR: [
      {
        clubMemberships: {
          some: { club: { isArchived: false, members: { some: { userId } } } },
        },
      },
      {
        riffParticipations: {
          some: { riff: { participants: { some: { userId } } } },
        },
      },
      {
        // They joined one of my pieces.
        individualShares: {
          some: { shareType: "INDIVIDUAL", piece: { authorId: userId } },
        },
      },
      {
        // I joined one of their pieces.
        pieces: {
          some: {
            newShares: {
              some: { shareType: "INDIVIDUAL", sharedWithId: userId },
            },
          },
        },
      },
    ],
  };
}

/**
 * Full friends list for a user — clubmates in active clubs, riffmates, and
 * individual piece-invite friends (either direction), deduped by id
 * (earlier sources take precedence on ordering when someone appears in more
 * than one, since they're merged in that order).
 */
export async function getFriends(userId: string): Promise<FriendSummary[]> {
  const [clubmates, riffmates, joinedMyPieces, piecesIJoined] =
    await Promise.all([
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
      prisma.share.findMany({
        where: { shareType: "INDIVIDUAL", piece: { authorId: userId } },
        select: {
          sharedWith: {
            select: { id: true, name: true, username: true, avatarUrl: true },
          },
        },
        distinct: ["sharedWithId"],
      }),
      prisma.share.findMany({
        where: { shareType: "INDIVIDUAL", sharedWithId: userId },
        select: {
          piece: {
            select: {
              author: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        distinct: ["pieceId"],
      }),
    ]);

  const friendsById = new Map<string, FriendSummary>();
  for (const { user: friend } of [...clubmates, ...riffmates]) {
    friendsById.set(friend.id, friend);
  }
  for (const { sharedWith } of joinedMyPieces) {
    if (sharedWith) friendsById.set(sharedWith.id, sharedWith);
  }
  for (const { piece } of piecesIJoined) {
    friendsById.set(piece.author.id, piece.author);
  }
  return Array.from(friendsById.values());
}

/**
 * Pairwise friendship check for call sites that already have both IDs.
 * Just friendOfWhere applied to authorId, as a single query.
 */
export async function isFriendOf(
  viewerId: string,
  authorId: string
): Promise<boolean> {
  if (viewerId === authorId) return false;

  const author = await prisma.user.findFirst({
    where: { id: authorId, ...friendOfWhere(viewerId) },
    select: { id: true },
  });

  return !!author;
}
