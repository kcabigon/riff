import { NextResponse } from "next/server";
import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import {
  createNotification,
  notifyRiffParticipants,
} from "@/lib/notifications";

// POST /api/riffs/[id]/attach-draft - Attach an existing standalone draft
// (a piece with zero PieceRiff rows) to this riff, auto-joining the caller
// as a RiffParticipant if they aren't one already. Mirrors the join+create
// flow in POST /api/drafts, but for a piece that already exists.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: riffId } = await params;
    const body = await req.json().catch(() => ({}));
    const { pieceId } = body as { pieceId?: string };

    if (!pieceId) {
      return NextResponse.json(
        { error: "pieceId is required" },
        { status: 400 }
      );
    }

    const riff = await prisma.riff.findUnique({
      where: { id: riffId },
      select: { id: true, status: true, clubId: true, creatorId: true },
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

    // Club riffs: must be a club member. Clubless riffs: no gate — mirrors
    // POST /api/drafts and POST /api/riffs/[id]/participants.
    if (riff.clubId) {
      const member = await prisma.clubMember.findFirst({
        where: { clubId: riff.clubId, userId: user.id },
      });

      if (!member) {
        return NextResponse.json(
          { error: "You must be a club member to write for this riff" },
          { status: 403 }
        );
      }
    }

    const piece = await prisma.piece.findUnique({
      where: { id: pieceId },
      select: { id: true, authorId: true },
    });

    if (!piece || piece.authorId !== user.id) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    // Check the caller doesn't already have a different piece attached to
    // this riff — mirrors the same guard in POST /api/drafts.
    const existingPieceRiff = await prisma.pieceRiff.findFirst({
      where: { riffId, piece: { authorId: user.id } },
    });

    if (existingPieceRiff) {
      return NextResponse.json(
        { error: "You already have a draft in this riff" },
        { status: 400 }
      );
    }

    const { didJoin } = await prisma.$transaction(async (tx) => {
      // Re-check the piece is still standalone inside the transaction —
      // narrows (but doesn't fully close, since PieceRiff has no
      // one-row-per-piece constraint) a race against attaching the same
      // draft from two tabs at once.
      const attachedCount = await tx.pieceRiff.count({ where: { pieceId } });
      if (attachedCount > 0) {
        throw new Error("ALREADY_ATTACHED");
      }

      await tx.pieceRiff.create({
        data: { pieceId, riffId, versionId: null },
      });

      const existingParticipant = await tx.riffParticipant.findUnique({
        where: { riffId_userId: { riffId, userId: user.id } },
      });

      if (!existingParticipant) {
        await tx.riffParticipant.create({
          data: { riffId, userId: user.id },
        });
      }

      return { didJoin: !existingParticipant };
    });

    if (didJoin && !riff.clubId) {
      try {
        await notifyRiffParticipants(
          riffId,
          NotificationType.RIFF_PARTICIPANT_JOINED,
          user.id
        );
        const creatorIsParticipant = await prisma.riffParticipant.findUnique({
          where: { riffId_userId: { riffId, userId: riff.creatorId } },
        });
        if (!creatorIsParticipant) {
          await createNotification({
            type: NotificationType.RIFF_PARTICIPANT_JOINED,
            recipientId: riff.creatorId,
            actorId: user.id,
            riffId,
          });
        }
      } catch (err) {
        console.error("[notification error] attach draft join:", err);
      }
    }

    return NextResponse.json({ success: true, pieceId }, { status: 201 });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (error.message === "ALREADY_ATTACHED") {
      return NextResponse.json(
        { error: "This draft was just attached to another riff" },
        { status: 409 }
      );
    }

    console.error("Error attaching draft:", error);
    return NextResponse.json(
      { error: "An error occurred while attaching the draft" },
      { status: 500 }
    );
  }
}
