import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

const ADMIN_EMAIL = "kyle.cabigon@gmail.com";

export async function GET() {
  try {
    const user = await requireAuth();
    if (user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [
      users,
      clubs,
      riffs,
      pieces,
      comments,
      riffsByStatus,
      totalWords,
      recentUsers,
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
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          firstName: true,
          lastName: true,
          email: true,
          createdAt: true,
          onboardingCompleted: true,
        },
      }),
    ]);

    const riffStatusMap = Object.fromEntries(
      riffsByStatus.map((r) => [r.status, r._count])
    );

    return NextResponse.json({
      overview: {
        users,
        clubs,
        riffs,
        pieces,
        comments,
        totalWords: totalWords._sum.wordCount ?? 0,
      },
      riffsByStatus: {
        draft: riffStatusMap["DRAFT"] ?? 0,
        active: riffStatusMap["ACTIVE"] ?? 0,
        revealed: riffStatusMap["REVEALED"] ?? 0,
        completed: riffStatusMap["COMPLETED"] ?? 0,
      },
      recentUsers: recentUsers.map((u) => ({
        name: [u.firstName, u.lastName].filter(Boolean).join(" ") || "(no name)",
        email: u.email,
        joined: u.createdAt,
        onboarded: u.onboardingCompleted,
      })),
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
