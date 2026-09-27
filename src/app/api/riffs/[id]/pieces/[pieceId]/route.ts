import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import {
  notifyClubMembers,
  notifyRiffParticipants,
  createNotification,
} from "@/lib/notifications";
import {
  sendPieceSubmittedEmail,
  sendAllPiecesSubmittedEmail,
  batchNotificationsEnabled,
} from "@/lib/resend";
import { NotificationType } from "@prisma/client";
import { getBaseUrl } from "@/lib/env";
import { allPiecesSubmitted } from "@/lib/riff-utils";

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

    // Fire notifications — isolated so failures don't affect the submission response
    const riff = submission.riff;
    const riffDisplayTitle = riff.title || riff.club?.name || "your riff";

    try {
      const riffUrl = `${getBaseUrl()}/riffs/${riffId}`;

      if (riff.clubId) {
        await notifyClubMembers(
          riff.clubId,
          NotificationType.PIECE_SUBMITTED_TO_RIFF,
          user.id,
          { riffId }
        ).catch((err) =>
          console.error("[notification error] piece submitted:", err)
        );

        const pieceMembers = await prisma.clubMember.findMany({
          where: { clubId: riff.clubId, userId: { not: user.id } },
          include: { user: { select: { email: true, name: true } } },
        });
        const pieceEnabled = await batchNotificationsEnabled(
          pieceMembers.map((m) => m.user.email)
        );
        const eligiblePieceMembers = pieceMembers.filter((m) =>
          pieceEnabled.has(m.user.email)
        );
        console.info(
          `[notify] piece submitted ${riffId}: ${pieceMembers.length} members, ${eligiblePieceMembers.length} email-enabled`
        );
        const pieceResults = await Promise.allSettled(
          eligiblePieceMembers.map((m) =>
            sendPieceSubmittedEmail({
              email: m.user.email,
              actorName:
                user.name || user.firstName || user.username || "Someone",
              riffTitle: riffDisplayTitle,
              clubName: riff.club?.name ?? "your club",
              riffUrl,
            })
          )
        );
        console.info(
          `[notify] piece submitted ${riffId}: ${pieceResults.filter((r) => r.status === "fulfilled").length} sent, ${pieceResults.filter((r) => r.status === "rejected").length} failed`
        );
      } else {
        // Clubless riff — same pipeline, scoped to riff participants
        await notifyRiffParticipants(
          riffId,
          NotificationType.PIECE_SUBMITTED_TO_RIFF,
          user.id
        ).catch((err) =>
          console.error("[notification error] piece submitted:", err)
        );

        const pieceParticipants = await prisma.riffParticipant.findMany({
          where: { riffId, userId: { not: user.id } },
          include: { user: { select: { email: true, name: true } } },
        });
        const pieceEnabled = await batchNotificationsEnabled(
          pieceParticipants.map((p) => p.user.email)
        );
        const eligiblePieceParticipants = pieceParticipants.filter((p) =>
          pieceEnabled.has(p.user.email)
        );
        console.info(
          `[notify] piece submitted ${riffId}: ${pieceParticipants.length} participants, ${eligiblePieceParticipants.length} email-enabled`
        );
        const pieceResults = await Promise.allSettled(
          eligiblePieceParticipants.map((p) =>
            sendPieceSubmittedEmail({
              email: p.user.email,
              actorName:
                user.name || user.firstName || user.username || "Someone",
              riffTitle: riffDisplayTitle,
              clubName: riffDisplayTitle,
              riffUrl,
            })
          )
        );
        console.info(
          `[notify] piece submitted ${riffId}: ${pieceResults.filter((r) => r.status === "fulfilled").length} sent, ${pieceResults.filter((r) => r.status === "rejected").length} failed`
        );
      }

      // Tell the host the riff is ready to reveal early. Read back rather than
      // adjusting the pre-update counts by one: this has to agree with the
      // reveal button the host is about to go looking for, and that button
      // calls allPiecesSubmitted on live data. Previously this used its own
      // aggregate comparison, so the mail and the button could disagree.
      //
      // Sharing the predicate also drops the count comparison's blind spot —
      // `submitted >= participants` counts pieces, not people, so one author
      // submitting two pieces satisfied it while a second writer was still
      // drafting. Note it does not change the case where members never write
      // at all: "all submitted" has always meant everyone who started, and a
      // club where most members stay silent still qualifies.
      const progress = await prisma.riff.findUnique({
        where: { id: riffId },
        select: {
          participants: { select: { user: { select: { id: true } } } },
          pieces: {
            select: {
              submittedAt: true,
              piece: { select: { authorId: true, wordCount: true } },
            },
          },
          club: { select: { _count: { select: { members: true } } } },
        },
      });

      // A solo club always satisfies "everyone submitted" the moment its one
      // writer does, which makes the mail noise rather than news — there is
      // nobody else to wait on and the host is the person who just submitted.
      const memberCount = progress?.club?._count.members ?? 0;
      const worthTelling = riff.clubId ? memberCount >= 2 : true;

      if (
        progress &&
        worthTelling &&
        allPiecesSubmitted(progress.participants, progress.pieces)
      ) {
        await createNotification({
          type: NotificationType.ALL_PIECES_SUBMITTED,
          recipientId: riff.creatorId,
          riffId,
          clubId: riff.clubId ?? undefined,
        }).catch((err) =>
          console.error("[notification error] all pieces submitted:", err)
        );

        const host = await prisma.user.findUnique({
          where: { id: riff.creatorId },
          select: { email: true, emailNotifications: true },
        });
        if (host?.emailNotifications) {
          console.info(
            `[notify] all pieces submitted ${riffId}: sending host email to ${host.email}`
          );
          await sendAllPiecesSubmittedEmail({
            email: host.email,
            riffTitle: riffDisplayTitle,
            clubName: riff.club?.name ?? riffDisplayTitle,
            riffUrl,
          }).catch((err) =>
            console.error(
              "[notification error] all pieces submitted email:",
              err
            )
          );
        } else {
          console.info(
            `[notify] all pieces submitted ${riffId}: host email skipped (emailNotifications=false)`
          );
        }
      }
    } catch (err) {
      console.error(
        "[notification error] piece submitted pipeline failed:",
        err
      );
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

    if (
      submission.riff.status === "REVEALED" ||
      submission.riff.status === "COMPLETED"
    ) {
      return NextResponse.json(
        { error: "Can't detach a piece from a riff that's already revealed" },
        { status: 400 }
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
