import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getContentPreview } from "@/lib/riff-utils";

// Shared between the initial home page load and the /api/home/* pagination
// routes it calls on "View all" — same select/include, same serialization,
// so a page-2 fetch is indistinguishable from data that shipped on page 1.

const PIECE_SELECT = {
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
    where: { shareType: "PUBLIC" as const },
    select: { id: true },
    take: 1,
  },
} satisfies Prisma.PieceSelect;

type RawPiece = Prisma.PieceGetPayload<{ select: typeof PIECE_SELECT }>;

function serializePiece(p: RawPiece) {
  return {
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
  };
}

// "Finished" = submitted to at least one riff, or published standalone.
// Mirrors MyRiffsClient's isFinished() — kept in one place since it now has
// to be expressed as a Prisma filter too, not just a client-side predicate.
const FINISHED_PIECE_WHERE = {
  OR: [
    { riffs: { some: { submittedAt: { not: null } } } },
    { publishedAt: { not: null } },
  ],
} satisfies Prisma.PieceWhereInput;

const DRAFT_PIECE_WHERE = {
  riffs: { none: { submittedAt: { not: null } } },
  publishedAt: null,
} satisfies Prisma.PieceWhereInput;

export async function getPiecesPage(
  userId: string,
  kind: "draft" | "submitted",
  { cursor, limit }: { cursor?: string | null; limit: number }
) {
  const rows = await prisma.piece.findMany({
    where: {
      authorId: userId,
      ...(kind === "submitted" ? FINISHED_PIECE_WHERE : DRAFT_PIECE_WHERE),
    },
    select: PIECE_SELECT,
    orderBy: { updatedAt: "desc" },
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    take: limit + 1,
  });
  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  return {
    pieces: page.map(serializePiece),
    nextCursor: hasMore ? page[page.length - 1].id : null,
    hasMore,
  };
}

export const RIFF_INCLUDE = {
  club: {
    select: {
      id: true,
      name: true,
      bannerImage: true,
      adminId: true,
      moderatorId: true,
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
} satisfies Prisma.RiffInclude;

type RawRiff = Prisma.RiffGetPayload<{ include: typeof RIFF_INCLUDE }>;

export function serializeRiff(r: RawRiff) {
  return {
    id: r.id,
    title: r.title,
    volumeNumber: r.volumeNumber,
    status: r.status,
    prompt: r.prompt,
    deadline: r.deadline ? r.deadline.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    creatorId: r.creatorId,
    creator: r.creator,
    club: r.club,
    participants: r.participants,
    pieces: r.pieces.map((p) => ({
      submittedAt: p.submittedAt ? p.submittedAt.toISOString() : null,
      piece: p.piece,
    })),
  };
}

// Only COMPLETED riffs are paginated here — they're the one bucket in "Past
// Riffs" that grows without bound (old volumes never go away). The other
// contributor to Past Riffs, REVEALED-and-fully-read riffs, comes from the
// ACTIVE/REVEALED participations query the home page already fetches in
// full (that set stays naturally small — people tend to read soon after
// reveal, it doesn't accumulate the way completed history does).
export async function getCompletedRiffsPage(
  userId: string,
  { cursor, limit }: { cursor?: string | null; limit: number }
) {
  const rows = await prisma.riff.findMany({
    where: { status: "COMPLETED", participants: { some: { userId } } },
    include: RIFF_INCLUDE,
    orderBy: { createdAt: "desc" },
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    take: limit + 1,
  });
  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  return {
    riffs: page.map(serializeRiff),
    nextCursor: hasMore ? page[page.length - 1].id : null,
    hasMore,
  };
}
