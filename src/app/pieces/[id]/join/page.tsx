import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getContentPreview } from "@/lib/riff-utils";
import { isFriendOf } from "@/lib/friends";
import PieceJoinClient from "@/components/pieces/PieceJoinClient";

async function getEligiblePiece(pieceId: string) {
  const piece = await prisma.piece.findUnique({
    where: { id: pieceId },
    select: {
      id: true,
      title: true,
      subtitle: true,
      currentContent: true,
      wordCount: true,
      readLengthMin: true,
      publishedAt: true,
      authorId: true,
      author: {
        select: {
          id: true,
          firstName: true,
          name: true,
          username: true,
          avatarUrl: true,
        },
      },
      riffs: {
        where: { submittedAt: { not: null } },
        select: {
          submittedAt: true,
          riff: { select: { status: true } },
        },
        orderBy: { submittedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!piece) return null;

  const isRevealed =
    piece.publishedAt !== null ||
    piece.riffs.some(
      (r) => r.riff.status === "REVEALED" || r.riff.status === "COMPLETED"
    );

  if (!isRevealed) return null;

  return piece;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: pieceId } = await params;
  const piece = await getEligiblePiece(pieceId);

  if (!piece) return { title: "Join on Riff" };

  const authorName =
    piece.author.firstName || piece.author.name || piece.author.username;
  return {
    title: `${piece.title || "Untitled"} — ${authorName} wants to riff`,
  };
}

export default async function PieceJoinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: pieceId } = await params;
  const piece = await getEligiblePiece(pieceId);

  if (!piece) notFound();

  const session = await getSession();

  if (session?.user) {
    if (session.user.id === piece.authorId) {
      redirect(`/read/${pieceId}`);
    }
    if (await isFriendOf(session.user.id, piece.authorId)) {
      redirect(`/read/${pieceId}`);
    }
  }

  let hasName = false;
  let needsOnboarding = false;
  let loggedInUser: {
    id: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
  } | null = null;

  if (session?.user) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        firstName: true,
        name: true,
        username: true,
        avatarUrl: true,
        onboardingCompleted: true,
      },
    });

    hasName = !!user?.firstName;
    needsOnboarding = !user?.onboardingCompleted;
    if (user) {
      loggedInUser = {
        id: user.id,
        name: user.name,
        username: user.username,
        avatarUrl: user.avatarUrl,
      };
    }
  }

  const submittedAt =
    piece.riffs[0]?.submittedAt?.toISOString() ??
    piece.publishedAt?.toISOString() ??
    null;

  return (
    <PieceJoinClient
      piece={{
        id: piece.id,
        title: piece.title,
        subtitle: piece.subtitle,
        wordCount: piece.wordCount,
        readLengthMin: piece.readLengthMin,
        preview: getContentPreview(piece.currentContent, 1200),
        submittedAt,
        author: piece.author,
      }}
      isLoggedIn={!!session?.user}
      hasName={hasName}
      needsOnboarding={needsOnboarding}
      user={loggedInUser}
    />
  );
}
