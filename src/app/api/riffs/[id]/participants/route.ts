import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// POST /api/riffs/[id]/participants - Join a riff (opt-in)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: riffId } = await params;

    const riff = await prisma.riff.findUnique({
      where: { id: riffId },
      include: {
        participants: true,
      },
    });

    if (!riff) {
      return NextResponse.json({ error: "Riff not found" }, { status: 404 });
    }

    // Can only join ACTIVE riffs
    if (riff.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Can only join active riffs" },
        { status: 400 }
      );
    }

    // Check if user is a club member
    const member = await prisma.clubMember.findFirst({
      where: {
        clubId: riff.clubId,
        userId: (user as any).id,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "You must be a club member to join this riff" },
        { status: 403 }
      );
    }

    // Check if already a participant
    const existingParticipant = riff.participants.find(
      (p) => p.userId === (user as any).id
    );

    if (existingParticipant) {
      return NextResponse.json(
        { error: "You are already a participant in this riff" },
        { status: 400 }
      );
    }

    // Add participant
    const participant = await prisma.riffParticipant.create({
      data: {
        riffId,
        userId: (user as any).id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        participant,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error joining riff:", error);
    return NextResponse.json(
      { error: "An error occurred while joining the riff" },
      { status: 500 }
    );
  }
}
