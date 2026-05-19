import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import AdminDashboard from "@/components/admin/AdminDashboard";

const ADMIN_EMAIL = "kyle.cabigon@gmail.com";

export const metadata = {
  title: "Admin Dashboard",
};

export default async function AdminPage() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user?.email !== ADMIN_EMAIL) {
    redirect("/");
  }

  const [
    userCount,
    clubCount,
    riffCount,
    pieceCount,
    commentCount,
    riffsByStatus,
    totalWords,
    onboardedCount,
    recentUsers,
    topClubs,
    recentPieces,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.club.count(),
    prisma.riff.count(),
    prisma.piece.count(),
    prisma.comment.count(),
    prisma.riff.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.piece.aggregate({
      _sum: { wordCount: true },
    }),
    prisma.user.count({
      where: { onboardingCompleted: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
        onboardingCompleted: true,
      },
    }),
    prisma.club.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            members: true,
            riffs: true,
          },
        },
      },
      orderBy: {
        members: { _count: "desc" },
      },
      take: 5,
    }),
    prisma.piece.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        wordCount: true,
        createdAt: true,
        author: {
          select: { firstName: true, lastName: true },
        },
      },
    }),
  ]);

  const riffStatusMap = Object.fromEntries(
    riffsByStatus.map((r: { status: string; _count: number }) => [r.status, r._count])
  );

  return (
    <AdminDashboard
      overview={{
        users: userCount,
        onboarded: onboardedCount,
        clubs: clubCount,
        riffs: riffCount,
        pieces: pieceCount,
        comments: commentCount,
        totalWords: totalWords._sum.wordCount ?? 0,
      }}
      riffsByStatus={{
        draft: riffStatusMap["DRAFT"] ?? 0,
        active: riffStatusMap["ACTIVE"] ?? 0,
        revealed: riffStatusMap["REVEALED"] ?? 0,
        completed: riffStatusMap["COMPLETED"] ?? 0,
      }}
      recentUsers={recentUsers.map((u) => ({
        id: u.id,
        name:
          [u.firstName, u.lastName].filter(Boolean).join(" ") || "(no name)",
        email: u.email,
        joined: u.createdAt.toISOString(),
        onboarded: u.onboardingCompleted,
      }))}
      topClubs={topClubs.map((c) => ({
        id: c.id,
        name: c.name,
        members: c._count.members,
        riffs: c._count.riffs,
      }))}
      recentPieces={recentPieces.map((p) => ({
        id: p.id,
        title: p.title,
        wordCount: p.wordCount,
        created: p.createdAt.toISOString(),
        author:
          [p.author.firstName, p.author.lastName].filter(Boolean).join(" ") ||
          "(no name)",
      }))}
    />
  );
}
