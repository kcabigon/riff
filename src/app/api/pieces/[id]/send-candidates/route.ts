import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { getFriends } from "@/lib/friends";

// GET /api/pieces/[id]/send-candidates — friends list for the Share modal's
// "Send to friends" picker, each annotated with whether they've already
// been made aware of this piece via the riff it was submitted through (if
// any) — either by reading it, or by belonging to the club/riff that got
// the automatic "piece submitted" notification when it was submitted — so
// the client can pre-deselect them and avoid a redundant email.
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
          select: { riffId: true, riff: { select: { clubId: true } } },
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

    const submittedRiff = piece.riffs[0] ?? null;
    let alreadyNotifiedIds = new Set<string>();
    if (submittedRiff) {
      const reads = await prisma.pieceRead.findMany({
        where: { pieceId, riffId: submittedRiff.riffId },
        select: { userId: true },
      });
      alreadyNotifiedIds = new Set(reads.map((r) => r.userId));

      // The submit route emails every club member (or every riff
      // participant, for a clubless riff) the moment a piece is
      // submitted — so those people already know about it whether or
      // not they've actually opened it.
      const memberIds = submittedRiff.riff.clubId
        ? (
            await prisma.clubMember.findMany({
              where: { clubId: submittedRiff.riff.clubId },
              select: { userId: true },
            })
          ).map((m) => m.userId)
        : (
            await prisma.riffParticipant.findMany({
              where: { riffId: submittedRiff.riffId },
              select: { userId: true },
            })
          ).map((p) => p.userId);
      memberIds.forEach((id) => alreadyNotifiedIds.add(id));
    }

    const candidates = friends.map((friend) => ({
      ...friend,
      alreadyNotified: alreadyNotifiedIds.has(friend.id),
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
