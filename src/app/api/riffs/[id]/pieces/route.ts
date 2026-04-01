import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// POST /api/riffs/[id]/pieces - Submit a piece to a riff
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: riffId } = await params;
    const { pieceId, versionId } = await req.json();

    if (!pieceId) {
      return NextResponse.json(
        { error: "Piece ID is required" },
        { status: 400 }
      );
    }

    // Get riff
    const riff = await prisma.riff.findUnique({
      where: { id: riffId },
    });

    if (!riff) {
      return NextResponse.json({ error: "Riff not found" }, { status: 404 });
    }

    // Can only submit to ACTIVE riffs
    if (riff.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Can only submit pieces to active riffs" },
        { status: 400 }
      );
    }

    // Verify piece exists and user is the author
    const piece = await prisma.piece.findUnique({
      where: { id: pieceId },
    });

    if (!piece) {
      return NextResponse.json({ error: "Piece not found" }, { status: 404 });
    }

    if (piece.authorId !== user.id) {
      return NextResponse.json(
        { error: "You can only submit your own pieces" },
        { status: 403 }
      );
    }

    // Check if user is a participant (or automatically add them)
    let participant = await prisma.riffParticipant.findFirst({
      where: {
        riffId,
        userId: user.id,
      },
    });

    // Auto-join riff when submitting a piece
    if (!participant) {
      const member = await prisma.clubMember.findFirst({
        where: {
          clubId: riff.clubId,
          userId: user.id,
        },
      });

      if (!member) {
        return NextResponse.json(
          { error: "You must be a club member to submit to this riff" },
          { status: 403 }
        );
      }

      participant = await prisma.riffParticipant.create({
        data: {
          riffId,
          userId: user.id,
        },
      });
    }

    // If versionId provided, verify it exists and belongs to this piece
    if (versionId) {
      const version = await prisma.pieceVersion.findUnique({
        where: { id: versionId },
      });

      if (!version || version.pieceId !== pieceId) {
        return NextResponse.json(
          { error: "Invalid version for this piece" },
          { status: 400 }
        );
      }
    }

    // Check if piece already submitted to this riff
    const existing = await prisma.pieceRiff.findFirst({
      where: {
        pieceId,
        riffId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This piece has already been submitted to this riff" },
        { status: 400 }
      );
    }

    // Submit piece to riff
    const submission = await prisma.pieceRiff.create({
      data: {
        pieceId,
        riffId,
        versionId: versionId || null,
      },
      include: {
        piece: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
        version: {
          select: {
            id: true,
            versionNumber: true,
            title: true,
            excerpt: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        submission,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error submitting piece to riff:", error);
    return NextResponse.json(
      { error: "An error occurred while submitting the piece" },
      { status: 500 }
    );
  }
}
