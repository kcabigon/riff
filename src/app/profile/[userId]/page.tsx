import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import ProfilePage from "@/components/profile/ProfilePage";

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

  // Get the current user's last active club for back navigation
  const currentUser = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: { lastActiveClubId: true },
  });

  // Fetch the target user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      bio: true,
      avatarUrl: true,
      username: true,
    },
  });

  if (!user) {
    redirect("/");
  }

  // Compute stats
  const stats = await prisma.piece.aggregate({
    where: { authorId: userId },
    _count: { id: true },
    _sum: { wordCount: true },
  });

  // Fetch all pieces by this user with their riff and share info
  const allPieces = await prisma.piece.findMany({
    where: { authorId: userId },
    select: {
      id: true,
      title: true,
      coverImage: true,
      currentContent: true,
      createdAt: true,
      updatedAt: true,
      riffs: {
        select: {
          versionId: true,
          riff: {
            select: { id: true, title: true },
          },
        },
      },
      newShares: {
        select: { id: true },
        take: 1, // We only need to know if at least one exists
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Submitted pieces: have at least one PieceRiff with a non-null versionId
  const submittedPieceIds = new Set(
    allPieces
      .filter((p) => p.riffs.some((r) => r.versionId !== null))
      .map((p) => p.id)
  );

  // Pieces tab: submitted pieces only
  const pieces = allPieces
    .filter((p) => submittedPieceIds.has(p.id))
    .map((p) => ({
      id: p.id,
      title: p.title,
      coverImage: p.coverImage,
      currentContent: p.currentContent,
    }));

  // Drafts tab: pieces NOT submitted (no PieceRiff with versionId)
  const drafts = allPieces
    .filter((p) => !submittedPieceIds.has(p.id))
    .map((p) => ({
      id: p.id,
      title: p.title,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      isShared: p.newShares.length > 0,
      riffs: p.riffs.map((r) => ({
        id: r.riff.id,
        title: r.riff.title,
      })),
    }));

  // Collections: user's own collections with their pieces
  const collectionsRaw = await prisma.collection.findMany({
    where: { ownerId: userId },
    select: {
      id: true,
      name: true,
      pieces: {
        select: {
          piece: {
            select: {
              id: true,
              title: true,
              createdAt: true,
              updatedAt: true,
              riffs: {
                select: {
                  riff: {
                    select: { id: true, title: true },
                  },
                },
              },
              newShares: {
                select: { id: true },
                take: 1,
              },
            },
          },
        },
        orderBy: { addedAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const collections = collectionsRaw.map((col) => ({
    id: col.id,
    name: col.name,
    pieces: col.pieces.map((cp) => ({
      id: cp.piece.id,
      title: cp.piece.title,
      createdAt: cp.piece.createdAt.toISOString(),
      updatedAt: cp.piece.updatedAt.toISOString(),
      isShared: cp.piece.newShares.length > 0,
      riffs: cp.piece.riffs.map((r) => ({
        id: r.riff.id,
        title: r.riff.title,
      })),
    })),
  }));

  const isOwnProfile = currentUserId === userId;

  return (
    <ProfilePage
      user={user}
      stats={{
        pieceCount: stats._count.id,
        totalWordCount: stats._sum.wordCount ?? 0,
      }}
      pieces={pieces}
      drafts={drafts}
      collections={collections}
      isOwnProfile={isOwnProfile}
      lastActiveClubId={currentUser?.lastActiveClubId ?? null}
    />
  );
}
