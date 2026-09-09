import { NextResponse } from "next/server";
import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import {
  createNotification,
  notifyRiffParticipants,
} from "@/lib/notifications";

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

    // Club riffs: must be a club member. Clubless (open) riffs have no gate —
    // the riff link is the invitation; any authenticated user can join.
    if (riff.clubId) {
      const member = await prisma.clubMember.findFirst({
        where: {
          clubId: riff.clubId,
          userId: user.id,
        },
      });

      if (!member) {
        return NextResponse.json(
          { error: "You must be a club member to join this riff" },
          { status: 403 }
        );
      }
    }

    // Check if already a participant
    const existingParticipant = riff.participants.find(
      (p) => p.userId === user.id
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
        userId: user.id,
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

    // Clubless riffs: tell existing participants + the creator someone joined
    // (in-app only, no email). Club-riff joins fire nothing today — unchanged.
    if (!riff.clubId) {
      try {
        await notifyRiffParticipants(
          riffId,
          NotificationType.RIFF_PARTICIPANT_JOINED,
          user.id
        );
        const creatorIsParticipant = riff.participants.some(
          (p) => p.userId === riff.creatorId
        );
        if (!creatorIsParticipant) {
          await createNotification({
            type: NotificationType.RIFF_PARTICIPANT_JOINED,
            recipientId: riff.creatorId,
            actorId: user.id,
            riffId,
          });
        }
      } catch (err) {
        console.error("[notification error] riff participant joined:", err);
      }
    }

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
