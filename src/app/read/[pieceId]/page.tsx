import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import ReadPageLayout from "@/components/read/ReadPageLayout";

export default async function ReadPage({
  params,
  searchParams,
}: {
  params: Promise<{ pieceId: string }>;
  searchParams: Promise<{ riff?: string; from?: string; userId?: string }>;
}) {
  const { pieceId } = await params;
  const { riff: riffId, from, userId: fromUserId } = await searchParams;
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Fetch piece with author info
  const piece = await prisma.piece.findUnique({
    where: { id: pieceId },
    select: {
      id: true,
      title: true,
      subtitle: true,
      currentContent: true,
      coverImage: true,
      wordCount: true,
      readLengthMin: true,
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!piece) {
    redirect("/");
  }

  // Validate access: piece must be in a REVEALED riff and user must be a club member
  let validRiffId: string | null = null;
  let clubId: string | null = null;

  if (riffId) {
    const pieceRiff = await prisma.pieceRiff.findFirst({
      where: {
        pieceId,
        riffId,
        riff: {
          status: "REVEALED",
          club: {
            members: { some: { userId } },
          },
        },
      },
      select: {
        riffId: true,
        riff: { select: { clubId: true } },
      },
    });

    if (pieceRiff) {
      validRiffId = pieceRiff.riffId;
      clubId = pieceRiff.riff.clubId;
    }
  }

  if (!validRiffId) {
    const pieceRiff = await prisma.pieceRiff.findFirst({
      where: {
        pieceId,
        riff: {
          status: "REVEALED",
          club: {
            members: { some: { userId } },
          },
        },
      },
      select: {
        riffId: true,
        riff: { select: { clubId: true } },
      },
    });

    if (!pieceRiff) {
      redirect("/");
    }

    validRiffId = pieceRiff.riffId;
    clubId = pieceRiff.riff.clubId;
  }

  // Check if already read
  const existingRead = await prisma.pieceRead.findUnique({
    where: {
      userId_pieceId_riffId: {
        userId,
        pieceId,
        riffId: validRiffId,
      },
    },
  });

  // Fetch comments server-side
  const rawComments = await prisma.comment.findMany({
    where: { pieceId, riffId: validRiffId },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { selectionStart: "asc" },
  });

  // Serialize for client boundary
  const initialComments = rawComments.map((c) => ({
    id: c.id,
    content: c.content,
    selectionStart: c.selectionStart ?? 0,
    selectionEnd: c.selectionEnd ?? 0,
    selectedText: c.selectedText ?? "",
    authorId: c.authorId,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    author: c.author,
  }));

  // Fetch sibling pieces in same riff for navigation
  const siblingPieces = await prisma.pieceRiff.findMany({
    where: { riffId: validRiffId },
    select: {
      piece: {
        select: { id: true, title: true },
      },
    },
    orderBy: { submittedAt: "asc" },
  });

  const orderedPieces = siblingPieces.map((pr) => pr.piece);
  const currentIndex = orderedPieces.findIndex((p) => p.id === pieceId);
  const previousPiece =
    currentIndex > 0 ? orderedPieces[currentIndex - 1] : null;
  const nextPiece =
    currentIndex < orderedPieces.length - 1
      ? orderedPieces[currentIndex + 1]
      : null;

  // Fetch current user info for comment compose
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      avatarUrl: true,
    },
  });

  return (
    <ReadPageLayout
      piece={{
        id: piece.id,
        title: piece.title,
        subtitle: piece.subtitle,
        currentContent: piece.currentContent,
        coverImage: piece.coverImage,
        wordCount: piece.wordCount,
        readLengthMin: piece.readLengthMin,
        author: piece.author,
      }}
      riffId={validRiffId}
      clubId={clubId!}
      currentUser={
        currentUser ?? {
          id: userId,
          name: null,
          username: null,
          avatarUrl: null,
        }
      }
      initialComments={initialComments}
      isAlreadyRead={!!existingRead}
      previousPiece={previousPiece}
      nextPiece={nextPiece}
      fromProfileUserId={from === "profile" ? fromUserId : undefined}
    />
  );
}
