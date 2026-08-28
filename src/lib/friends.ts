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
 * Friend = clubmate in an active (non-archived) club, or riffmate (shared
 * RiffParticipant on any riff) — same definition used on My Riffs.
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
    ],
  };
}

/**
 * Full friends list for a user — clubmates in active clubs, unioned with
 * riffmates, deduped by id (clubmates take precedence on ordering when
 * someone is both, since they're merged in that order).
 */
export async function getFriends(userId: string): Promise<FriendSummary[]> {
  const [clubmates, riffmates] = await Promise.all([
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
  ]);

  const friendsById = new Map<string, FriendSummary>();
  for (const { user: friend } of [...clubmates, ...riffmates]) {
    friendsById.set(friend.id, friend);
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
