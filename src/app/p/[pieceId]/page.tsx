import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import PublicReadLayout from "./PublicReadLayout";

async function getPiece(pieceId: string) {
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
        select: { id: true, name: true, username: true, avatarUrl: true },
      },
      newShares: {
        where: { shareType: "PUBLIC", isPublic: true, isVisible: true },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!piece || piece.newShares.length === 0) return null;
  return piece;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pieceId: string }>;
}): Promise<Metadata> {
  const { pieceId } = await params;
  const piece = await getPiece(pieceId);
  if (!piece) return {};

  const title = piece.title || "Untitled";
  const authorName = piece.author.name || piece.author.username || "Anonymous";
  const description = piece.subtitle || `A piece by ${authorName} on Riff.`;

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: "article",
      ...(piece.coverImage ? { images: [{ url: piece.coverImage }] } : {}),
    },
    twitter: {
      card: piece.coverImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(piece.coverImage ? { images: [piece.coverImage] } : {}),
    },
  };
}

export default async function PublicPiecePage({
  params,
}: {
  params: Promise<{ pieceId: string }>;
}) {
  const { pieceId } = await params;
  const piece = await getPiece(pieceId);
  if (!piece) notFound();

  return <PublicReadLayout piece={piece} />;
}
