import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PublicReadLayout from "./PublicReadLayout";

export default async function PublicPiecePage({
  params,
}: {
  params: Promise<{ pieceId: string }>;
}) {
  const { pieceId } = await params;

  // Check for a public Share record — no auth required
  const publicShare = await prisma.share.findFirst({
    where: { pieceId, shareType: "PUBLIC", isPublic: true, isVisible: true },
    select: { id: true },
  });

  if (!publicShare) {
    notFound();
  }

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
    notFound();
  }

  return <PublicReadLayout piece={piece} />;
}
