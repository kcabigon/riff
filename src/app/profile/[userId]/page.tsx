import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import ProfilePage from "@/components/profile/ProfilePage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const { userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });
  return {
    title: user?.name ?? "Profile",
    description: `View ${user?.name ?? "this writer"}'s profile on Riff.`,
  };
}

export default async function ProfilePageRoute({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const currentUserId = session.user.id;

  // Get the current user's last active club for back navigation + nav display
  const currentUser = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: {
      id: true,
      username: true,
      name: true,
      avatarUrl: true,
      lastActiveClubId: true,
    },
  });

  // Fetch the target user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      username: true,
      avatarUrl: true,
      bio: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect("/");
  }

  // Fetch viewer's club memberships to gate piece access by club
  // (skip for own profile — owner always sees their pieces unlocked)
  const isOwnProfile = currentUserId === userId;
  const viewerClubIds = new Set<string>();
  if (!isOwnProfile) {
    const memberships = await prisma.clubMember.findMany({
      where: { userId: currentUserId },
      select: { clubId: true },
    });
    memberships.forEach((m) => viewerClubIds.add(m.clubId));
  }

  // Fetch submitted pieces by this user, with riff status + club to determine visibility
  const rawPieces = await prisma.piece.findMany({
    where: {
      authorId: userId,
      riffs: { some: { submittedAt: { not: null } } },
    },
    select: {
      id: true,
      title: true,
      coverImage: true,
      wordCount: true,
      riffs: {
        where: { submittedAt: { not: null } },
        select: {
          submittedAt: true,
          riff: { select: { status: true, clubId: true } },
        },
      },
      newShares: {
        where: { shareType: "PUBLIC" },
        select: { id: true },
        take: 1,
      },
    },
  });

  rawPieces.sort((a, b) => {
    const latestA = Math.max(...a.riffs.map((r) => r.submittedAt!.getTime()));
    const latestB = Math.max(...b.riffs.map((r) => r.submittedAt!.getTime()));
    return latestB - latestA;
  });

  const pieces = rawPieces.map((p) => ({
    id: p.id,
    title: p.title,
    coverImage: p.coverImage,
    wordCount: p.wordCount,
    // Revealed = riff is REVEALED/COMPLETED AND viewer is in that club
    // (own profile skips the club check — always accessible)
    isRevealed: p.riffs.some(
      (r) =>
        (r.riff.status === "REVEALED" || r.riff.status === "COMPLETED") &&
        (isOwnProfile || viewerClubIds.has(r.riff.clubId))
    ),
    // Viewer has club access if they're a member of any club this piece's riff belongs to
    viewerHasClubAccess: p.riffs.some((r) => viewerClubIds.has(r.riff.clubId)),
    isPublic: p.newShares.length > 0,
    publicShareId: p.newShares[0]?.id ?? null,
  }));

  const pieceCount = pieces.length;
  const totalWordCount = pieces.reduce((sum, p) => sum + (p.wordCount ?? 0), 0);

  const jams = await prisma.jam.findMany({
    where: { userId },
    select: { id: true, url: true, content: true, note: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ProfilePage
      user={user}
      currentUser={
        currentUser
          ? {
              id: currentUser.id,
              username: currentUser.username,
              name: currentUser.name,
              avatarUrl: currentUser.avatarUrl,
            }
          : null
      }
      stats={{ pieceCount, totalWordCount }}
      pieces={pieces}
      jams={jams}
      isOwnProfile={isOwnProfile}
      lastActiveClubId={currentUser?.lastActiveClubId ?? null}
    />
  );
}
