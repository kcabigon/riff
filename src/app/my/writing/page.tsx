import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import MyWritingPage from "@/components/writing/MyWritingPage";

export const metadata = { title: "My Writing — Riff" };

export default async function MyWritingPageRoute() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  // Nav data
  const [navUser, userClubs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, username: true, avatarUrl: true },
    }),
    prisma.club.findMany({
      where: { members: { some: { userId } }, isArchived: false },
      select: { id: true, name: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  // Content data — run separately so Prisma types infer correctly
  const pieces = await prisma.piece.findMany({
    where: { authorId: userId },
    include: {
      riffs: {
        include: {
          riff: {
            select: {
              id: true,
              title: true,
              volumeNumber: true,
              status: true,
              club: { select: { id: true, name: true } },
            },
          },
        },
      },
      newShares: {
        where: { isVisible: true },
        select: {
          id: true,
          shareType: true,
          clubId: true,
          isPublic: true,
          club: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const activeRiffs = await prisma.riff.findMany({
    where: {
      status: "ACTIVE",
      club: { members: { some: { userId } } },
    },
    select: {
      id: true,
      title: true,
      volumeNumber: true,
      club: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Split into drafts and pieces.
  // Piece = in a revealed riff, explicitly submitted to a riff, or has any Share record.
  const isGraduated = (p: (typeof pieces)[number]) =>
    p.riffs.some(
      (r) => r.submittedAt !== null || r.riff.status === "REVEALED"
    ) || p.newShares.length > 0;

  const draftPieces = pieces.filter((p) => !isGraduated(p));
  const submittedPieces = pieces.filter((p) => isGraduated(p));

  const serializeShares = (p: (typeof pieces)[number]) =>
    p.newShares.map((s) => ({
      id: s.id,
      shareType: s.shareType as "CLUB" | "PUBLIC",
      clubId: s.clubId,
      isPublic: s.isPublic,
      club: s.club ?? null,
    }));

  const serializeRiffs = (p: (typeof pieces)[number]) =>
    p.riffs.map((r) => ({
      riffId: r.riffId,
      submittedAt: r.submittedAt ? r.submittedAt.toISOString() : null,
      riff: {
        id: r.riff.id,
        title: r.riff.title,
        volume: r.riff.volumeNumber ?? 1,
        status: r.riff.status,
        club: r.riff.club,
      },
    }));

  const drafts = draftPieces.map((p) => ({
    id: p.id,
    title: p.title,
    updatedAt: p.updatedAt.toISOString(),
    wordCount: p.wordCount,
    coverImage: p.coverImage,
    currentContent: p.currentContent,
    riffs: serializeRiffs(p),
    shares: serializeShares(p),
  }));

  const pieceItems = submittedPieces.map((p) => ({
    id: p.id,
    title: p.title,
    coverImage: p.coverImage,
    currentContent: p.currentContent,
    wordCount: p.wordCount,
    riffs: serializeRiffs(p),
    shares: serializeShares(p),
  }));

  const riffItems = activeRiffs.map((r) => ({
    id: r.id,
    title: r.title,
    volume: r.volumeNumber ?? 1,
    club: r.club,
  }));

  return (
    <MyWritingPage
      navUser={navUser!}
      userClubs={userClubs}
      initialDrafts={drafts}
      initialPieces={pieceItems}
      activeRiffs={riffItems}
    />
  );
}
