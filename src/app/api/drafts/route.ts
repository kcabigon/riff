import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// POST /api/drafts - Create a new draft piece connected to a riff
export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const userId = user.id;
    const body = await req.json().catch(() => ({}));
    const { riffId } = body;

    if (!riffId) {
      return NextResponse.json(
        { error: "riffId is required" },
        { status: 400 }
      );
    }

    const riff = await prisma.riff.findUnique({
      where: { id: riffId },
      select: { id: true, status: true, clubId: true },
    });

    if (!riff) {
      return NextResponse.json({ error: "Riff not found" }, { status: 404 });
    }

    if (riff.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Riff is not active" },
        { status: 400 }
      );
    }

    // Verify user is a club member
    const member = await prisma.clubMember.findFirst({
      where: { clubId: riff.clubId, userId },
    });

    if (!member) {
      return NextResponse.json(
        { error: "You must be a club member to write for this riff" },
        { status: 403 }
      );
    }

    // Check if user already has a piece connected to this riff
    const existingPieceRiff = await prisma.pieceRiff.findFirst({
      where: {
        riffId,
        piece: { authorId: userId },
      },
      include: {
        piece: {
          select: { id: true, title: true, currentContent: true },
        },
      },
    });

    if (existingPieceRiff) {
      return NextResponse.json(
        {
          success: true,
          piece: existingPieceRiff.piece,
          existing: true,
        },
        { status: 200 }
      );
    }

    // Create piece + PieceRiff + auto-join riff if not participant
    const piece = await prisma.piece.create({
      data: {
        title: "Untitled",
        currentContent: "<p></p>",
        authorId: userId,
        riffs: {
          create: {
            riffId,
            versionId: null,
          },
        },
      },
      select: { id: true, title: true, currentContent: true },
    });

    // Auto-join riff if not already a participant
    const isParticipant = await prisma.riffParticipant.findUnique({
      where: { riffId_userId: { riffId, userId } },
    });

    if (!isParticipant) {
      await prisma.riffParticipant.create({
        data: { riffId, userId },
      });
    }

    return NextResponse.json({ success: true, piece }, { status: 201 });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error creating draft:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the draft" },
      { status: 500 }
    );
  }
}
