import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// POST /api/riffs/[id]/read - Mark a piece as read for the current user
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: riffId } = await params;
    const { pieceId } = await req.json();

    if (!pieceId) {
      return NextResponse.json(
        { error: "pieceId is required" },
        { status: 400 }
      );
    }

    // Validate riff exists and is REVEALED
    const riff = await prisma.riff.findUnique({
      where: { id: riffId },
      select: {
        id: true,
        status: true,
        clubId: true,
        _count: { select: { pieces: true } },
      },
    });

    if (!riff) {
      return NextResponse.json({ error: "Riff not found" }, { status: 404 });
    }

    if (riff.status !== "REVEALED") {
      return NextResponse.json(
        { error: "Riff is not in revealed state" },
        { status: 400 }
      );
    }

    // Validate user is a club member
    const member = await prisma.clubMember.findFirst({
      where: {
        clubId: riff.clubId,
        userId: (user as any).id,
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate piece belongs to this riff
    const pieceRiff = await prisma.pieceRiff.findFirst({
      where: {
        pieceId,
        riffId,
      },
    });

    if (!pieceRiff) {
      return NextResponse.json(
        { error: "Piece does not belong to this riff" },
        { status: 400 }
      );
    }

    // Upsert PieceRead (idempotent)
    await prisma.pieceRead.upsert({
      where: {
        userId_pieceId_riffId: {
          userId: (user as any).id,
          pieceId,
          riffId,
        },
      },
      create: {
        userId: (user as any).id,
        pieceId,
        riffId,
      },
      update: {},
    });

    // Get updated read count for this user/riff
    const readCount = await prisma.pieceRead.count({
      where: {
        userId: (user as any).id,
        riffId,
      },
    });

    return NextResponse.json({
      success: true,
      readCount,
      totalPieces: riff._count.pieces,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error marking piece as read:", error);
    return NextResponse.json(
      { error: "An error occurred while marking piece as read" },
      { status: 500 }
    );
  }
}
