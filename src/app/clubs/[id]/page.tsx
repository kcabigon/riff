import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import ClubPageLayout from "@/components/clubs/ClubPageLayout";

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

  // Verify user is a member of this club
  const membership = await prisma.clubMember.findFirst({
    where: {
      clubId: id,
      userId,
    },
  });

  if (!membership) {
    // User has no membership in this club — check if they have any club at all
    const anyMembership = await prisma.clubMember.findFirst({
      where: { userId },
      include: { club: { select: { id: true } } },
    });

    if (anyMembership) {
      redirect(`/clubs/${anyMembership.club.id}`);
    }

    // No clubs at all — send back to onboarding
    redirect("/onboarding/club-choice");
  }

  // Fetch club details
  const club = await prisma.club.findUnique({
    where: { id },
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
  });

  if (!club) {
    redirect("/onboarding/club-choice");
  }

  // Fetch all clubs user is a member of (for the dropdown)
  const userClubs = await prisma.club.findMany({
    where: {
      members: { some: { userId } },
      isArchived: false,
    },
    select: { id: true, name: true },
    orderBy: { updatedAt: "desc" },
  });

  // Fetch riffs with participants and pieces
  const riffs = await prisma.riff.findMany({
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
              currentContent: true,
              coverImage: true,
              wordCount: true,
            },
          },
        },
        orderBy: { id: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Compute stats
  const riffCount = riffs.length;
  const pieceCount = riffs.reduce(
    (sum, r) => sum + r.pieces.filter((p) => p.submittedAt !== null).length,
    0
  );
  const wordCount = riffs.reduce(
    (sum, r) =>
      sum +
      r.pieces
        .filter((p) => p.submittedAt !== null)
        .reduce((s, p) => s + (p.piece?.wordCount || 0), 0),
    0
  );

  // Serialize dates to strings for client component boundary (Prisma returns Date objects)
  const serializeRiff = (r: (typeof riffs)[0]) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    deadline: r.deadline ? r.deadline.toISOString() : null,
  });

  // Separate riffs by status
  const activeRiff = riffs.find((r) => r.status === "ACTIVE")
    ? serializeRiff(riffs.find((r) => r.status === "ACTIVE")!)
    : null;
  const revealedRiffs = riffs
    .filter((r) => r.status === "REVEALED")
    .map(serializeRiff);
  const completedRiffs = riffs
    .filter((r) => r.status === "COMPLETED")
    .map(serializeRiff);

  // Fetch read counts for revealed riffs (per-user)
  // Own pieces are treated as auto-read and excluded from the "to read" total
  const revealedRiffIds = revealedRiffs.map((r) => r.id);
  let readCounts: Record<string, number> = {};
  if (revealedRiffIds.length > 0) {
    const readGroups = await prisma.pieceRead.groupBy({
      by: ["riffId"],
      where: {
        userId,
        riffId: { in: revealedRiffIds },
      },
      _count: { pieceId: true },
    });
    readCounts = Object.fromEntries(
      readGroups.map((g) => [g.riffId, g._count.pieceId])
    );
    // Add own piece to readCount so it doesn't count as unread
    for (const riff of revealedRiffs) {
      const hasOwnPiece = riff.pieces.some(
        (p) => p.piece.authorId === userId && p.submittedAt !== null
      );
      if (hasOwnPiece) {
        readCounts[riff.id] = (readCounts[riff.id] || 0) + 1;
      }
    }
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
      readCounts={readCounts}
      completedRiffs={completedRiffs}
      stats={{ riffCount, pieceCount, wordCount }}
      initialWelcome={
        welcome === "host" || welcome === "member" ? welcome : undefined
      }
    />
  );
}
