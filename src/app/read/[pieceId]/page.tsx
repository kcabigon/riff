import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import ReadPageLayout from "@/components/read/ReadPageLayout";

export default async function ReadPage({
  params,
  searchParams,
}: {
  params: Promise<{ pieceId: string }>;
  searchParams: Promise<{ riff?: string }>;
}) {
  const { pieceId } = await params;
  const { riff: riffId } = await searchParams;
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id;

  // Fetch piece with author info
  const piece = await prisma.piece.findUnique({
    where: { id: pieceId },
    select: {
      id: true,
      title: true,
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

  if (riffId) {
    // Check specific riff
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
      select: { riffId: true },
    });

    if (pieceRiff) {
      validRiffId = pieceRiff.riffId;
    }
  }

  if (!validRiffId) {
    // Find any REVEALED riff containing this piece where user is a member
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
      select: { riffId: true },
    });

    if (!pieceRiff) {
      redirect("/");
    }

    validRiffId = pieceRiff.riffId;
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

  return (
    <ReadPageLayout
      piece={{
        id: piece.id,
        title: piece.title,
        currentContent: piece.currentContent,
        coverImage: piece.coverImage,
        wordCount: piece.wordCount,
        readLengthMin: piece.readLengthMin,
        author: piece.author,
      }}
      riffId={validRiffId}
      isAlreadyRead={!!existingRead}
    />
  );
}
