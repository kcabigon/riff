import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { notifyClubMembers, createNotification } from "@/lib/notifications";
import {
  sendPieceSubmittedEmail,
  sendAllPiecesSubmittedEmail,
} from "@/lib/resend";
import { NotificationType } from "@prisma/client";

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
      include: {
        piece: { select: { authorId: true, title: true } },
        riff: {
          select: {
            id: true,
            title: true,
            clubId: true,
            creatorId: true,
            participants: { select: { userId: true } },
            pieces: {
              where: { submittedAt: { not: null } },
              select: { id: true },
            },
            club: { select: { name: true } },
          },
        },
      },
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

    // Fire notifications (non-blocking)
    const riff = submission.riff;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const riffUrl = `${appUrl}/riffs/${riffId}`;
    const riffDisplayTitle = riff.title || "Active Riff";

    // Notify all club members + send emails
    notifyClubMembers(
      riff.clubId,
      NotificationType.PIECE_SUBMITTED_TO_RIFF,
      user.id,
      { riffId }
    ).catch(() => {});
    prisma.clubMember
      .findMany({
        where: { clubId: riff.clubId, userId: { not: user.id } },
        include: { user: { select: { email: true, name: true } } },
      })
      .then((members) =>
        Promise.allSettled(
          members.map((m) =>
            sendPieceSubmittedEmail({
              email: m.user.email,
              actorName: user.name || "Someone",
              riffTitle: riffDisplayTitle,
              clubName: riff.club.name,
              riffUrl,
            })
          )
        )
      )
      .catch(() => {});

    // Check if all participants have now submitted — notify host
    const submittedCount = riff.pieces.length + 1; // +1 for this submission
    const participantCount = riff.participants.length;
    if (participantCount > 0 && submittedCount >= participantCount) {
      createNotification({
        type: NotificationType.ALL_PIECES_SUBMITTED,
        recipientId: riff.creatorId,
        riffId,
        clubId: riff.clubId,
      }).catch(() => {});

      prisma.user
        .findUnique({ where: { id: riff.creatorId }, select: { email: true } })
        .then((host) => {
          if (host) {
            return sendAllPiecesSubmittedEmail({
              email: host.email,
              riffTitle: riffDisplayTitle,
              clubName: riff.club.name,
              riffUrl,
            });
          }
        })
        .catch(() => {});
    }

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
