import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// PATCH /api/riffs/[id]/pieces/[pieceId] - Submit piece to riff (set submittedAt)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; pieceId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: riffId, pieceId } = await params;

    const submission = await prisma.pieceRiff.findFirst({
      where: { riffId, pieceId },
      include: { piece: true },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Piece submission not found" },
        { status: 404 }
      );
    }

    if (submission.piece.authorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.pieceRiff.update({
      where: { id: submission.id },
      data: { submittedAt: new Date() },
    });

    return NextResponse.json({ success: true, submission: updated });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error submitting piece to riff:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}

// DELETE /api/riffs/[id]/pieces/[pieceId] - Remove piece from riff
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; pieceId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: riffId, pieceId } = await params;

    // Find the submission
    const submission = await prisma.pieceRiff.findFirst({
      where: {
        riffId,
        pieceId,
      },
      include: {
        piece: true,
        riff: true,
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Piece submission not found" },
        { status: 404 }
      );
    }

    // Only the piece author or riff creator can remove the submission
    const canDelete =
      submission.piece.authorId === user.id ||
      submission.riff.creatorId === user.id;

    if (!canDelete) {
      return NextResponse.json(
        { error: "You don't have permission to remove this piece" },
        { status: 403 }
      );
    }

    // Delete submission
    await prisma.pieceRiff.delete({
      where: { id: submission.id },
    });

    return NextResponse.json({
      success: true,
      message: "Piece removed from riff successfully",
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error removing piece from riff:", error);
    return NextResponse.json(
      { error: "An error occurred while removing the piece" },
      { status: 500 }
    );
  }
}
