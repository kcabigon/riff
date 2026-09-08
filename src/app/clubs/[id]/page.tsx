import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import ClubPageLayout from "@/components/clubs/ClubPageLayout";
import {
  getSubmittedPieces,
  getTotalWordCount,
  getContentPreview,
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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { id } = await params;
  const { welcome } = await searchParams;
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Fetch club (filtered to clubs the user is a member of), user's clubs dropdown,
  // and riffs all in parallel. If club is null, user is not a member of this club.
  const [club, userClubs, riffs] = await Promise.all([
    prisma.club.findFirst({
      where: { id, members: { some: { userId } }, isArchived: false },
      select: {
        id: true,
        name: true,
        description: true,
        bannerImage: true,
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
                currentContent: true,
              },
            },
          },
          orderBy: { id: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!club) {
    // Club is archived or user is not a member — find another active club
    const anyMembership = await prisma.clubMember.findFirst({
      where: { userId, club: { isArchived: false } },
      include: { club: { select: { id: true } } },
    });

    if (anyMembership) {
      redirect(`/clubs/${anyMembership.club.id}`);
    }

    redirect("/my-riffs");
  }

  // joinedAt is available from the members list already fetched above
  const memberJoinedAt = club.members.find(
    (m) => m.userId === userId
  )!.joinedAt;

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
  // Never ship currentContent for pieces authored by someone else — only the
  // current user's own draft preview is ever rendered client-side, and this
  // is fetched pre-reveal, so leaking it in the RSC payload would spoil
  // unrevealed work in progress for every other participant.
  const serializeRiff = (r: (typeof riffs)[0]) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
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
            ? getContentPreview(pr.piece.currentContent, 500)
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
    const reads = await prisma.pieceRead.findMany({
      where: { userId, riffId: { in: revealedRiffIds } },
      select: { riffId: true, pieceId: true },
    });
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
      completedRiffs={completedRiffs}
      stats={{ riffCount, pieceCount, wordCount }}
      predictedVolumeNumber={predictedVolumeNumber}
      initialWelcome={
        welcome === "host" || welcome === "member" ? welcome : undefined
      }
    />
  );
}
