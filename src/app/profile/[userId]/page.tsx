import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { isFriendOf } from "@/lib/friends";
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

  // Gate piece access by friendship (clubmate in an active club, or riffmate)
  // — skip for own profile, owner always sees their pieces unlocked
  const isOwnProfile = currentUserId === userId;
  const viewerHasAccess =
    isOwnProfile || (await isFriendOf(currentUserId, userId));

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
          riff: { select: { status: true } },
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
    // Revealed = riff is REVEALED/COMPLETED AND viewer has access (owner or friend)
    isRevealed: p.riffs.some(
      (r) =>
        (r.riff.status === "REVEALED" || r.riff.status === "COMPLETED") &&
        viewerHasAccess
    ),
    viewerHasAccess,
    isPublic: p.newShares.length > 0,
    publicShareId: p.newShares[0]?.id ?? null,
  }));

  const pieceCount = pieces.length;
  const totalWordCount = pieces.reduce((sum, p) => sum + (p.wordCount ?? 0), 0);

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
      isOwnProfile={isOwnProfile}
      lastActiveClubId={currentUser?.lastActiveClubId ?? null}
    />
  );
}
