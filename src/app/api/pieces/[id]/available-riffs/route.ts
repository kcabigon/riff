import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/pieces/[id]/available-riffs
// Returns ACTIVE riffs the user can attach this piece to (member of club, not already attached)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const userId = (user as any).id;
    const { id: pieceId } = await params;

    const riffs = await prisma.riff.findMany({
      where: {
        status: "ACTIVE",
        club: {
          members: {
            some: { userId },
          },
        },
        pieces: {
          none: { pieceId },
        },
      },
      select: {
        id: true,
        title: true,
        clubId: true,
        club: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ riffs });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
