import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ClubPageLayout from "@/components/clubs/ClubPageLayout";

export default async function ClubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id;

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
              wordCount: true,
            },
          },
        },
        orderBy: { submittedAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Compute stats
  const riffCount = riffs.length;
  const pieceCount = riffs.reduce((sum, r) => sum + r.pieces.length, 0);
  const wordCount = riffs.reduce(
    (sum, r) =>
      sum +
      r.pieces.reduce((s, p) => s + (p.piece?.wordCount || 0), 0),
    0
  );

  // Serialize dates to strings for client component boundary (Prisma returns Date objects)
  const serializeRiff = (r: (typeof riffs)[0]) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    deadline: r.deadline ? r.deadline.toISOString() : null,
  });

  // Separate active riff (at most one) from completed riffs
  const activeRiff = riffs.find((r) => r.status === "ACTIVE")
    ? serializeRiff(riffs.find((r) => r.status === "ACTIVE")!)
    : null;
  const completedRiffs = riffs
    .filter((r) => r.status === "COMPLETED")
    .map(serializeRiff);

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
      completedRiffs={completedRiffs}
      stats={{ riffCount, pieceCount, wordCount }}
    />
  );
}
