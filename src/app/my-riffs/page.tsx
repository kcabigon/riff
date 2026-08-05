import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import MyRiffsClient from "./MyRiffsClient";

export const metadata: Metadata = {
  title: "Riffs",
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

  // For active riffs, compute predictedVolumeNumber per club (count of REVEALED+COMPLETED riffs + 1)
  const activeClubIds = [
    ...new Set(riffs.filter((r) => r.status === "ACTIVE").map((r) => r.clubId)),
  ];

  const [pieceReads, volumeCounts] = await Promise.all([
    riffIds.length > 0
      ? prisma.pieceRead.findMany({
          where: { userId, riffId: { in: riffIds } },
          select: { riffId: true },
        })
      : Promise.resolve([]),
    activeClubIds.length > 0
      ? prisma.riff.groupBy({
          by: ["clubId"],
          where: {
            clubId: { in: activeClubIds },
            status: { in: ["REVEALED", "COMPLETED"] },
          },
          _count: { id: true },
        })
      : Promise.resolve([]),
  ]);

  const readCounts: Record<string, number> = {};
  for (const read of pieceReads) {
    readCounts[read.riffId] = (readCounts[read.riffId] || 0) + 1;
  }

  const predictedVolumeByClub: Record<string, number> = {};
  for (const clubId of activeClubIds) {
    predictedVolumeByClub[clubId] = 1;
  }
  for (const row of volumeCounts) {
    predictedVolumeByClub[row.clubId] = row._count.id + 1;
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
      predictedVolumeByClub={predictedVolumeByClub}
    />
  );
}
