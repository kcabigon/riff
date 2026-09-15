import { NextResponse } from "next/server";
import { NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import {
  createNotification,
  notifyRiffParticipants,
} from "@/lib/notifications";
import { getContentPreview } from "@/lib/riff-utils";

// POST /api/drafts - Create a new draft piece, optionally connected to a riff
export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const userId = user.id;
    const body = await req.json().catch(() => ({}));
    const { riffId } = body as { riffId?: string };

    if (!riffId) {
      const piece = await prisma.piece.create({
        data: {
          title: "Untitled",
          currentContent: "<p></p>",
          authorId: userId,
        },
        select: { id: true, title: true, currentContent: true },
      });

      return NextResponse.json({ success: true, piece }, { status: 201 });
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

    // Club riffs: must be a club member. Clubless riffs: no gate — the riff
    // link is the invitation, and the existing auto-join below adds them.
    if (riff.clubId) {
      const member = await prisma.clubMember.findFirst({
        where: { clubId: riff.clubId, userId },
      });

      if (!member) {
        return NextResponse.json(
          { error: "You must be a club member to write for this riff" },
          { status: 403 }
        );
      }
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

    // Create piece + PieceRiff + auto-join riff (if not already a
    // participant) atomically, so a failure partway through never leaves a
    // piece attached to a riff without a matching participant row.
    const { piece, didJoin } = await prisma.$transaction(async (tx) => {
      const piece = await tx.piece.create({
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

      const existingParticipant = await tx.riffParticipant.findUnique({
        where: { riffId_userId: { riffId, userId } },
      });

      if (!existingParticipant) {
        await tx.riffParticipant.create({
          data: { riffId, userId },
        });
      }

      return { piece, didJoin: !existingParticipant };
    });

    // Clubless riffs: tell existing participants + the creator someone
    // joined (in-app only, no email). Club-riff joins fire nothing today —
    // mirrors POST /api/riffs/[id]/participants.
    if (didJoin && !riff.clubId) {
      try {
        await notifyRiffParticipants(
          riffId,
          NotificationType.RIFF_PARTICIPANT_JOINED,
          userId
        );
        const creatorIsParticipant = await prisma.riffParticipant.findUnique({
          where: { riffId_userId: { riffId, userId: riff.creatorId } },
        });
        if (!creatorIsParticipant) {
          await createNotification({
            type: NotificationType.RIFF_PARTICIPANT_JOINED,
            recipientId: riff.creatorId,
            actorId: userId,
            riffId,
          });
        }
      } catch (err) {
        console.error("[notification error] draft creation join:", err);
      }
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

// GET /api/drafts - List the caller's standalone drafts (unpublished pieces
// that have never been attached to any riff) for the "Attach draft" picker.
export async function GET() {
  try {
    const user = await requireAuth();

    const pieces = await prisma.piece.findMany({
      where: {
        authorId: user.id,
        riffs: { none: {} },
        publishedAt: null,
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        currentContent: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    // Preview computed server-side (plain text, HTML stripped) so the
    // picker never ships raw rich content it doesn't need.
    const serialized = pieces.map((p) => ({
      id: p.id,
      title: p.title,
      preview: getContentPreview(p.currentContent, 120),
      updatedAt: p.updatedAt,
      createdAt: p.createdAt,
    }));

    return NextResponse.json({ success: true, pieces: serialized });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error listing standalone drafts:", error);
    return NextResponse.json(
      { error: "An error occurred while listing drafts" },
      { status: 500 }
    );
  }
}
