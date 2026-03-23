import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import RiffPageLayout from "@/components/riffs/RiffPageLayout";

export default async function RiffPage({
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

  // Fetch riff with full data
  const riff = await prisma.riff.findUnique({
    where: { id },
    include: {
      club: {
        select: { id: true, name: true, adminId: true },
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
        orderBy: { joinedAt: "asc" },
      },
      pieces: {
        include: {
          piece: {
            select: {
              id: true,
              title: true,
              authorId: true,
              wordCount: true,
              coverImage: true,
              currentContent: true,
              author: {
                select: { id: true, name: true, avatarUrl: true },
              },
              _count: {
                select: {
                  comments: {
                    where: { riffId: id },
                  },
                },
              },
            },
          },
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!riff) {
    redirect("/");
  }

  // Verify user is a club member
  const member = await prisma.clubMember.findFirst({
    where: {
      clubId: riff.clubId,
      userId,
    },
  });

  if (!member) {
    redirect("/");
  }

  const isJoined = riff.participants.some((p) => p.user.id === userId);
  const hasSubmitted = riff.pieces.some((p) => p.piece.authorId === userId);
  const isAdmin = riff.club.adminId === userId;

  // Fetch read piece IDs for REVEALED riffs
  let readPieceIds: string[] = [];
  if (riff.status === "REVEALED") {
    const reads = await prisma.pieceRead.findMany({
      where: { userId, riffId: id },
      select: { pieceId: true },
    });
    readPieceIds = reads.map((r) => r.pieceId);
  }

  // Serialize dates to strings for client component boundary (Prisma returns Date objects)
  const serializedRiff = {
    ...riff,
    createdAt: riff.createdAt.toISOString(),
    deadline: riff.deadline ? riff.deadline.toISOString() : null,
    pieces: riff.pieces.map((pr) => ({
      ...pr,
      piece: {
        ...pr.piece,
        commentCount: pr.piece._count?.comments ?? 0,
        _count: undefined,
      },
    })),
  };

  return (
    <RiffPageLayout
      riff={serializedRiff}
      currentUserId={userId}
      isAdmin={isAdmin}
      isJoined={isJoined}
      hasSubmitted={hasSubmitted}
      readPieceIds={readPieceIds}
    />
  );
}
