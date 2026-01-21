import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// DELETE /api/riffs/[id]/participants/[userId] - Leave a riff
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: riffId, userId: targetUserId } = await params;

    const riff = await prisma.riff.findUnique({
      where: { id: riffId },
    });

    if (!riff) {
      return NextResponse.json({ error: "Riff not found" }, { status: 404 });
    }

    // Users can only remove themselves
    if (targetUserId !== (user as any).id) {
      return NextResponse.json(
        { error: "You can only remove yourself from a riff" },
        { status: 403 }
      );
    }

    // Find participant record
    const participant = await prisma.riffParticipant.findFirst({
      where: {
        riffId,
        userId: targetUserId,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "You are not a participant in this riff" },
        { status: 404 }
      );
    }

    // Remove participant
    await prisma.riffParticipant.delete({
      where: { id: participant.id },
    });

    return NextResponse.json({
      success: true,
      message: "Left riff successfully",
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error leaving riff:", error);
    return NextResponse.json(
      { error: "An error occurred while leaving the riff" },
      { status: 500 }
    );
  }
}
