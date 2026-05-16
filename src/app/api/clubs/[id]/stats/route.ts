import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/clubs/[id]/stats - Get aggregate stats for a club
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: clubId } = await params;

    // Verify user is a member of this club
    const member = await prisma.clubMember.findFirst({
      where: {
        clubId,
        userId: user.id,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "You are not a member of this club" },
        { status: 403 }
      );
    }

    // Count non-archived riffs
    const riffCount = await prisma.riff.count({
      where: { clubId },
    });

    // Get all piece submissions for this club's riffs with word counts
    const pieceStats = await prisma.pieceRiff.findMany({
      where: {
        riff: { clubId },
      },
      include: {
        piece: {
          select: { wordCount: true },
        },
      },
    });

    const pieceCount = pieceStats.length;
    const wordCount = pieceStats.reduce(
      (sum, ps) => sum + (ps.piece?.wordCount || 0),
      0
    );

    return NextResponse.json({
      riffCount,
      pieceCount,
      wordCount,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error fetching club stats:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching club stats" },
      { status: 500 }
    );
  }
}
