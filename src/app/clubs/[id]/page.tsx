import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import ClubPageLayout from "@/components/clubs/ClubPageLayout";
import { getSubmittedPieces, getTotalWordCount } from "@/lib/riff-utils";

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

    redirect("/no-club");
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

  // Serialize dates to strings for client component boundary (Prisma returns Date objects)
  const serializeRiff = (r: (typeof riffs)[0]) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    deadline: r.deadline ? r.deadline.toISOString() : null,
  });

  // Separate riffs by status
  // Revealed riffs are split by membership join date:
  // - post-join revealed riffs → "Current Read" (member was present for these)
  // - pre-join revealed riffs → "Past Riffs" (member joined after these revealed)
  const activeRiff = riffs.find((r) => r.status === "ACTIVE")
    ? serializeRiff(riffs.find((r) => r.status === "ACTIVE")!)
    : null;
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
  if (revealedRiffIds.length > 0) {
    const ownPieceIds = revealedRiffs.flatMap((r) =>
      r.pieces
        .filter((p) => p.piece.authorId === userId && p.submittedAt !== null)
        .map((p) => p.piece.id)
    );
    const readGroups = await prisma.pieceRead.groupBy({
      by: ["riffId"],
      where: {
        userId,
        riffId: { in: revealedRiffIds },
        ...(ownPieceIds.length > 0 && { pieceId: { notIn: ownPieceIds } }),
      },
      _count: { pieceId: true },
    });
    readCounts = Object.fromEntries(
      readGroups.map((g) => [g.riffId, g._count.pieceId])
    );
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
      completedRiffs={completedRiffs}
      stats={{ riffCount, pieceCount, wordCount }}
    />
  );
}
