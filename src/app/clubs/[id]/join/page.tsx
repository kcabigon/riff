import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import JoinClubClient from "@/components/clubs/JoinClubClient";

export default async function JoinClubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: clubId } = await params;

  // Fetch club details — public, no auth required
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: {
      id: true,
      name: true,
      description: true,
      bannerImage: true,
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
      riffs: {
        select: {
          id: true,
          pieces: { select: { piece: { select: { wordCount: true } } } },
        },
      },
    },
  });

  if (!club) {
    notFound();
  }

  // Compute stats
  const riffCount = club.riffs.length;
  const pieceCount = club.riffs.reduce((sum, r) => sum + r.pieces.length, 0);
  const wordCount = club.riffs.reduce(
    (sum, r) =>
      sum + r.pieces.reduce((s, p) => s + (p.piece?.wordCount || 0), 0),
    0
  );

  const session = await getSession();

  let hasName = false;
  let needsOnboarding = false;

  // Logged in — check membership and onboarding state
  if (session?.user) {
    const userId = session.user.id;

    // Already a member → go to club
    const membership = await prisma.clubMember.findFirst({
      where: { clubId, userId },
    });
    if (membership) {
      redirect(`/clubs/${clubId}`);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, onboardingCompleted: true },
    });

    hasName = !!user?.firstName;
    needsOnboarding = !user?.onboardingCompleted;
  }

  return (
    <JoinClubClient
      club={{
        id: club.id,
        name: club.name,
        description: club.description,
        bannerImage: club.bannerImage,
        members: club.members,
      }}
      stats={{ riffCount, pieceCount, wordCount }}
      isLoggedIn={!!session?.user}
      hasName={hasName}
      needsOnboarding={needsOnboarding}
    />
  );
}
