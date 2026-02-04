import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/users/[id] - Get user profile data and stats
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        bio: true,
        avatarUrl: true,
        username: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Compute stats: pieceCount and totalWordCount
    const stats = await prisma.piece.aggregate({
      where: { authorId: id },
      _count: { id: true },
      _sum: { wordCount: true },
    });

    return NextResponse.json({
      user,
      stats: {
        pieceCount: stats._count.id,
        totalWordCount: stats._sum.wordCount ?? 0,
      },
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching user profile" },
      { status: 500 }
    );
  }
}
