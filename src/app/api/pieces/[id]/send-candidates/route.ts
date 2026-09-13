import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { getFriends } from "@/lib/friends";

// GET /api/pieces/[id]/send-candidates — friends list for the Share modal's
// "Send to friends" picker, each annotated with whether they've already
// read this piece via the riff it was submitted through (if any) so the
// client can pre-deselect them.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: pieceId } = await params;

    const piece = await prisma.piece.findUnique({
      where: { id: pieceId },
      select: {
        authorId: true,
        riffs: {
          where: { submittedAt: { not: null } },
          select: { riffId: true },
          orderBy: { submittedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!piece) {
      return NextResponse.json({ error: "Piece not found" }, { status: 404 });
    }

    if (piece.authorId !== user.id) {
      return NextResponse.json(
        { error: "Only the author can do this" },
        { status: 403 }
      );
    }

    const friends = await getFriends(user.id);

    const submittedRiffId = piece.riffs[0]?.riffId ?? null;
    let alreadyReadIds = new Set<string>();
    if (submittedRiffId) {
      const reads = await prisma.pieceRead.findMany({
        where: { pieceId, riffId: submittedRiffId },
        select: { userId: true },
      });
      alreadyReadIds = new Set(reads.map((r) => r.userId));
    }

    const candidates = friends.map((friend) => ({
      ...friend,
      alreadyRead: alreadyReadIds.has(friend.id),
    }));

    return NextResponse.json({ candidates });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching send candidates:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching friends" },
      { status: 500 }
    );
  }
}
