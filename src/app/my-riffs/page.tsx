import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import MyRiffsClient from "./MyRiffsClient";

export const metadata: Metadata = {
  title: "My Riffs",
};

export default async function MyRiffsPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [participations, userClubs, user] = await Promise.all([
    prisma.riffParticipant.findMany({
      where: { userId },
      include: {
        riff: {
          include: {
            club: { select: { id: true, name: true } },
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    username: true,
                    avatarUrl: true,
                  },
                },
              },
            },
            pieces: {
              include: {
                piece: {
                  select: {
                    id: true,
                    title: true,
                    authorId: true,
                    coverImage: true,
                    wordCount: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.club.findMany({
      where: { members: { some: { userId } }, isArchived: false },
      select: { id: true, name: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        avatarUrl: true,
        lastActiveClubId: true,
      },
    }),
  ]);

  if (!user) redirect("/login");

  const riffs = participations.map((p) => p.riff);
  const riffIds = riffs.map((r) => r.id);

  const pieceReads =
    riffIds.length > 0
      ? await prisma.pieceRead.findMany({
          where: { userId, riffId: { in: riffIds } },
          select: { riffId: true },
        })
      : [];

  const readCounts: Record<string, number> = {};
  for (const read of pieceReads) {
    readCounts[read.riffId] = (readCounts[read.riffId] || 0) + 1;
  }

  const currentClub =
    userClubs.find((c) => c.id === user.lastActiveClubId) ??
    userClubs[0] ??
    null;

  const serializedRiffs = riffs.map((r) => ({
    id: r.id,
    title: r.title,
    volumeNumber: r.volumeNumber,
    status: r.status,
    prompt: r.prompt,
    deadline: r.deadline ? r.deadline.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    club: r.club,
    participants: r.participants,
    pieces: r.pieces.map((p) => ({
      submittedAt: p.submittedAt ? p.submittedAt.toISOString() : null,
      piece: p.piece,
    })),
  }));

  return (
    <MyRiffsClient
      user={user}
      userClubs={userClubs}
      currentClub={currentClub}
      riffs={serializedRiffs}
      currentUserId={userId}
      readCounts={readCounts}
    />
  );
}
