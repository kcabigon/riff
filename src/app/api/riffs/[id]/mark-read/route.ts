import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// POST /api/riffs/[id]/mark-read — bulk-update readAt for all pieces the user has read on this riff
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: riffId } = await params;

    const riff = await prisma.riff.findUnique({
      where: { id: riffId },
      select: {
        status: true,
        clubId: true,
        club: {
          select: {
            members: { where: { userId: user.id }, select: { id: true } },
          },
        },
        participants: { where: { userId: user.id }, select: { id: true } },
      },
    });

    if (!riff) {
      return NextResponse.json({ error: "Riff not found" }, { status: 404 });
    }
    // Club riffs: club member. Clubless riffs: riff participant.
    const hasAccess = riff.clubId
      ? (riff.club?.members.length ?? 0) > 0
      : riff.participants.length > 0;
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (riff.status !== "REVEALED") {
      return NextResponse.json(
        { error: "Riff not yet revealed" },
        { status: 403 }
      );
    }

    // Union of pieces already marked read, plus the user's own pieces in
    // this riff. Own pieces never get a PieceRead row from normal viewing
    // (see GET /api/riffs/[id]/comments), so a plain updateMany would
    // silently skip them here — upsert so new comments on your own piece
    // actually get cleared too, not just pieces you've explicitly read.
    // Never touches a piece the user hasn't read at all (no Unread badge
    // gets cleared by this call).
    const [existingReads, ownPieces] = await Promise.all([
      prisma.pieceRead.findMany({
        where: { riffId, userId: user.id },
        select: { pieceId: true },
      }),
      prisma.pieceRiff.findMany({
        where: { riffId, piece: { authorId: user.id } },
        select: { pieceId: true },
      }),
    ]);
    const pieceIds = [
      ...new Set([
        ...existingReads.map((r) => r.pieceId),
        ...ownPieces.map((p) => p.pieceId),
      ]),
    ];

    await Promise.all(
      pieceIds.map((pieceId) =>
        prisma.pieceRead.upsert({
          where: {
            userId_pieceId_riffId: { userId: user.id, pieceId, riffId },
          },
          create: { userId: user.id, pieceId, riffId },
          update: { readAt: new Date() },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error marking riff as read:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
