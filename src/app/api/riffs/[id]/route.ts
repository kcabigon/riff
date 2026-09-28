import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { notifyUsers } from "@/lib/notifications";
import {
  sendRiffCreatedEmail,
  sendDeadlineChangedEmail,
  batchNotificationsEnabled,
} from "@/lib/resend";
import { NotificationType } from "@prisma/client";
import { getBaseUrl } from "@/lib/env";
import { revealRiff } from "@/lib/reveal-riff";

// GET /api/riffs/[id] - Get riff details
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: riffId } = await params;

    const riff = await prisma.riff.findUnique({
      where: { id: riffId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        club: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        participants: {
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
          orderBy: {
            joinedAt: "asc",
          },
        },
        pieces: {
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
                createdAt: true,
              },
            },
          },
          orderBy: {
            submittedAt: "desc",
          },
        },
      },
    });

    if (!riff) {
      return NextResponse.json({ error: "Riff not found" }, { status: 404 });
    }

    // Club riffs: must be a club member. Clubless riffs: must be a participant.
    if (riff.clubId) {
      const member = await prisma.clubMember.findFirst({
        where: {
          clubId: riff.clubId,
          userId: user.id,
        },
      });

      if (!member) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      const isParticipant = riff.participants.some((p) => p.userId === user.id);

      if (!isParticipant) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Strip piece content before reveal — cover image still returned for locked card teaser
    const sanitizedRiff =
      riff.status !== "REVEALED"
        ? {
            ...riff,
            pieces: riff.pieces.map((pr) => ({
              ...pr,
              piece: { ...pr.piece, currentContent: null },
            })),
          }
        : riff;

    return NextResponse.json({ riff: sanitizedRiff });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error fetching riff:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching the riff" },
      { status: 500 }
    );
  }
}

// PATCH /api/riffs/[id] - Update riff details or status
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: riffId } = await params;
    const { title, prompt, deadline, status } = await req.json();

    const riff = await prisma.riff.findUnique({
      where: { id: riffId },
    });

    if (!riff) {
      return NextResponse.json({ error: "Riff not found" }, { status: 404 });
    }

    // Check permissions — club riffs: club member; clubless: participant or creator
    if (riff.clubId) {
      const member = await prisma.clubMember.findFirst({
        where: {
          clubId: riff.clubId,
          userId: user.id,
        },
      });

      if (!member) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      const participant = await prisma.riffParticipant.findUnique({
        where: { riffId_userId: { riffId, userId: user.id } },
        select: { id: true },
      });

      if (!participant && riff.creatorId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Only DRAFT or ACTIVE riffs can have details edited
    if (
      (title || prompt || deadline !== undefined) &&
      !["DRAFT", "ACTIVE"].includes(riff.status)
    ) {
      return NextResponse.json(
        { error: "Can only edit draft or active riffs" },
        { status: 400 }
      );
    }

    // Fetch club for permission checks (club riffs only — clubless have no admin concept)
    const club = riff.clubId
      ? await prisma.club.findUnique({
          where: { id: riff.clubId },
          select: { adminId: true, moderatorId: true },
        })
      : null;

    const isClubAdmin = club?.adminId === user.id;
    const isClubCoHost = club?.moderatorId === user.id;
    const isClubAdminOrCoHost = isClubAdmin || isClubCoHost;
    // Host powers (reveal/complete): club riffs = admin/co-host; clubless = creator
    const canHost = riff.clubId
      ? isClubAdminOrCoHost
      : riff.creatorId === user.id;

    // Creator, admin, or co-host can update title, prompt, deadline
    if (
      (title || prompt || deadline !== undefined) &&
      riff.creatorId !== user.id &&
      !isClubAdminOrCoHost
    ) {
      return NextResponse.json(
        {
          error:
            "Only the riff creator, admin, or co-host can update riff details",
        },
        { status: 403 }
      );
    }

    // Status transition rules
    if (status && status !== riff.status) {
      if (!["DRAFT", "ACTIVE", "REVEALED", "COMPLETED"].includes(status)) {
        return NextResponse.json(
          { error: "Invalid riff status" },
          { status: 400 }
        );
      }

      if (status === "ACTIVE" && riff.status === "DRAFT") {
        // Only creator can activate from DRAFT
        if (riff.creatorId !== user.id) {
          return NextResponse.json(
            { error: "Only the riff creator can activate the riff" },
            { status: 403 }
          );
        }
      } else if (status === "REVEALED") {
        // Club riffs: admin or co-host can reveal. Clubless: creator. Riff must be ACTIVE.
        if (!canHost) {
          return NextResponse.json(
            {
              error: riff.clubId
                ? "Only the club admin or co-host can reveal pieces"
                : "Only the riff creator can reveal pieces",
            },
            { status: 403 }
          );
        }
        if (riff.status !== "ACTIVE") {
          return NextResponse.json(
            { error: "Only active riffs can be revealed" },
            { status: 400 }
          );
        }
        const submittedCount = await prisma.pieceRiff.count({
          where: { riffId, submittedAt: { not: null } },
        });
        if (submittedCount === 0) {
          return NextResponse.json(
            { error: "Can't reveal a riff before anyone has submitted" },
            { status: 400 }
          );
        }
      } else if (status === "COMPLETED") {
        // Club riffs: admin or co-host can complete. Clubless: creator.
        if (!canHost) {
          return NextResponse.json(
            {
              error: riff.clubId
                ? "Only the club admin or co-host can complete a riff"
                : "Only the riff creator can complete a riff",
            },
            { status: 403 }
          );
        }
      }
    }

    // Validate input
    if (title !== undefined && title && title.length > 200) {
      return NextResponse.json(
        { error: "Riff title must be 200 characters or less" },
        { status: 400 }
      );
    }

    // Every riff keeps its deadline. All four creation paths already require one
    // — club and clubless, UI and API — but editing could clear it, which on a
    // club with an interval cadence stalled the cadence sweep: a riff without a
    // deadline can't be revealed, given its grace week, or replaced, so it was
    // skipped every run and the club quietly stopped getting riffs.
    //
    // Enforced here rather than only in the edit modal so the invariant belongs
    // to the API. Falsy rather than strictly null, matching the write below,
    // which stores null for anything falsy — so "" would otherwise clear the
    // deadline while slipping past a null-only check. `undefined` is excluded
    // separately: it's the one falsy value meaning "field not provided".
    if (deadline !== undefined && !deadline) {
      return NextResponse.json(
        { error: "A riff needs a deadline" },
        { status: 400 }
      );
    }

    // Revealing is delegated to revealRiff() below — it owns the status change,
    // the atomic volume numbering, and the notifications, so the cadence cron
    // can reveal without a user session and the two paths can't drift. Any
    // other field edits in this same request are applied here first.
    const isRevealing = status === "REVEALED" && riff.status === "ACTIVE";

    const updatedRiff = await prisma.$transaction(async (tx) => {
      // Auto-join the creator when activating — atomic with the status change
      if (status === "ACTIVE" && riff.status === "DRAFT") {
        await tx.riffParticipant.upsert({
          where: { riffId_userId: { riffId, userId: user.id } },
          create: { riffId, userId: user.id },
          update: {},
        });
      }

      return tx.riff.update({
        where: { id: riffId },
        data: {
          ...(title !== undefined && { title: title?.trim() || null }),
          ...(prompt !== undefined && { prompt: prompt?.trim() || null }),
          ...(deadline !== undefined && {
            deadline: deadline ? new Date(deadline) : null,
          }),
          ...(status !== undefined && !isRevealing && { status }),
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              username: true,
              avatarUrl: true,
            },
          },
          club: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              participants: true,
              pieces: true,
            },
          },
        },
      });
    });

    // Fire notifications for status changes — isolated so failures don't affect the riff response
    if (status && status !== riff.status) {
      const actorId = user.id;
      // Clubless riffs skip RIFF_CREATED entirely — the join link replaces it
      if (status === "ACTIVE" && riff.clubId) {
        try {
          const riffCreatedUrl = `${getBaseUrl()}/clubs/${riff.clubId}`;
          // One fetch for both the in-app rows and the emails; the actor is
          // excluded by the query.
          const riffCreatedMembers = await prisma.clubMember.findMany({
            where: { clubId: riff.clubId, userId: { not: actorId } },
            select: { userId: true, user: { select: { email: true } } },
          });

          await notifyUsers(
            riffCreatedMembers.map((m) => m.userId),
            NotificationType.RIFF_CREATED,
            actorId,
            { clubId: riff.clubId, riffId }
          ).catch((err) =>
            console.error("[notification error] riff created:", err)
          );
          const riffCreatedEnabled = await batchNotificationsEnabled(
            riffCreatedMembers.map((m) => m.user.email)
          );
          const eligibleRiffCreated = riffCreatedMembers.filter((m) =>
            riffCreatedEnabled.has(m.user.email)
          );
          console.info(
            `[notify] riff created ${riffId}: ${riffCreatedMembers.length} members, ${eligibleRiffCreated.length} email-enabled`
          );
          const riffCreatedResults = await Promise.allSettled(
            eligibleRiffCreated.map((m) =>
              sendRiffCreatedEmail({
                email: m.user.email,
                actorName: updatedRiff.creator.name || "Your host",
                clubName: updatedRiff.club?.name ?? "your club",
                riffUrl: riffCreatedUrl,
                riffTitle: riff.title,
                prompt: riff.prompt,
                deadline: riff.deadline ?? null,
              })
            )
          );
          console.info(
            `[notify] riff created ${riffId}: ${riffCreatedResults.filter((r) => r.status === "fulfilled").length} sent, ${riffCreatedResults.filter((r) => r.status === "rejected").length} failed`
          );
        } catch (err) {
          console.error(
            "[notification error] riff created pipeline failed:",
            err
          );
        }
      } else if (isRevealing) {
        // Delegated: revealRiff owns the status change, the atomic volume
        // numbering, and the club/clubless notification split. actorId excludes
        // the host from their own notification; the cron passes null so nobody
        // is excluded.
        await revealRiff(riffId, { actorId }).catch((err) =>
          console.error("[notification error] riff revealed:", err)
        );
      }
    }

    // Fire deadline change notification if deadline actually changed — isolated so failures don't affect the riff response
    const deadlineChanged =
      deadline !== undefined &&
      deadline !== null &&
      !status &&
      new Date(deadline).getTime() !== (riff.deadline?.getTime() ?? null);
    if (deadlineChanged && riff.clubId) {
      try {
        const newDeadline = new Date(deadline);
        const riffUrl = `${getBaseUrl()}/clubs/${riff.clubId}`;
        const deadlineMembers = await prisma.clubMember.findMany({
          where: { clubId: riff.clubId, userId: { not: user.id } },
          select: { userId: true, user: { select: { email: true } } },
        });

        await notifyUsers(
          deadlineMembers.map((m) => m.userId),
          NotificationType.RIFF_DEADLINE_CHANGED,
          user.id,
          { clubId: riff.clubId, riffId }
        ).catch((err) =>
          console.error("[notification error] deadline changed:", err)
        );
        const deadlineEnabled = await batchNotificationsEnabled(
          deadlineMembers.map((m) => m.user.email)
        );
        const eligibleDeadline = deadlineMembers.filter((m) =>
          deadlineEnabled.has(m.user.email)
        );
        console.info(
          `[notify] deadline changed ${riffId}: ${deadlineMembers.length} members, ${eligibleDeadline.length} email-enabled`
        );
        const deadlineResults = await Promise.allSettled(
          eligibleDeadline.map((m) =>
            sendDeadlineChangedEmail({
              email: m.user.email,
              newDeadline,
              riffUrl,
              clubName: updatedRiff.club?.name ?? "your club",
            })
          )
        );
        console.info(
          `[notify] deadline changed ${riffId}: ${deadlineResults.filter((r) => r.status === "fulfilled").length} sent, ${deadlineResults.filter((r) => r.status === "rejected").length} failed`
        );
      } catch (err) {
        console.error(
          "[notification error] deadline changed pipeline failed:",
          err
        );
      }
    } else if (deadlineChanged) {
      // Clubless riff deadline change — same pipeline, scoped to riff participants
      try {
        const newDeadline = new Date(deadline);
        const riffUrl = `${getBaseUrl()}/riffs/${riffId}`;
        const deadlineParticipants = await prisma.riffParticipant.findMany({
          where: { riffId, userId: { not: user.id } },
          select: { userId: true, user: { select: { email: true } } },
        });

        await notifyUsers(
          deadlineParticipants.map((p) => p.userId),
          NotificationType.RIFF_DEADLINE_CHANGED,
          user.id,
          { riffId }
        ).catch((err) =>
          console.error("[notification error] deadline changed:", err)
        );
        const deadlineEnabled = await batchNotificationsEnabled(
          deadlineParticipants.map((p) => p.user.email)
        );
        const eligibleDeadline = deadlineParticipants.filter((p) =>
          deadlineEnabled.has(p.user.email)
        );
        console.info(
          `[notify] deadline changed ${riffId}: ${deadlineParticipants.length} participants, ${eligibleDeadline.length} email-enabled`
        );
        const deadlineResults = await Promise.allSettled(
          eligibleDeadline.map((p) =>
            sendDeadlineChangedEmail({
              email: p.user.email,
              newDeadline,
              riffUrl,
              clubName: updatedRiff.title ?? "your riff",
            })
          )
        );
        console.info(
          `[notify] deadline changed ${riffId}: ${deadlineResults.filter((r) => r.status === "fulfilled").length} sent, ${deadlineResults.filter((r) => r.status === "rejected").length} failed`
        );
      } catch (err) {
        console.error(
          "[notification error] deadline changed pipeline failed:",
          err
        );
      }
    }

    // On a reveal, updatedRiff was read before revealRiff() ran, so its status
    // and volumeNumber are stale. Re-read rather than return a riff that claims
    // to still be ACTIVE. (The reveal client only checks res.ok, but the
    // response shouldn't lie for anyone who does read it.)
    const responseRiff = isRevealing
      ? ((await prisma.riff.findUnique({
          where: { id: riffId },
          include: {
            creator: {
              select: { id: true, name: true, username: true, avatarUrl: true },
            },
            club: { select: { id: true, name: true } },
            _count: { select: { participants: true, pieces: true } },
          },
        })) ?? updatedRiff)
      : updatedRiff;

    return NextResponse.json({
      success: true,
      riff: responseRiff,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error updating riff:", error);
    return NextResponse.json(
      { error: "An error occurred while updating the riff" },
      { status: 500 }
    );
  }
}

// DELETE /api/riffs/[id] - Delete riff
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: riffId } = await params;

    const riff = await prisma.riff.findUnique({
      where: { id: riffId },
    });

    if (!riff) {
      return NextResponse.json({ error: "Riff not found" }, { status: 404 });
    }

    // Only DRAFT or ACTIVE riffs can be deleted
    if (!["DRAFT", "ACTIVE"].includes(riff.status)) {
      return NextResponse.json(
        { error: "Only draft or active riffs can be deleted" },
        { status: 400 }
      );
    }

    // Club riffs: creator or club admin can delete. Clubless: creator only.
    if (riff.clubId) {
      const club = await prisma.club.findUnique({
        where: { id: riff.clubId },
      });

      if (!club) {
        return NextResponse.json({ error: "Club not found" }, { status: 404 });
      }

      const canDelete = riff.creatorId === user.id || club.adminId === user.id;

      if (!canDelete) {
        return NextResponse.json(
          { error: "Only the riff creator or club admin can delete the riff" },
          { status: 403 }
        );
      }
    } else if (riff.creatorId !== user.id) {
      return NextResponse.json(
        { error: "Only the riff creator can delete the riff" },
        { status: 403 }
      );
    }

    // Delete riff (CASCADE will handle participants and piece_riffs)
    await prisma.riff.delete({
      where: { id: riffId },
    });

    return NextResponse.json({
      success: true,
      message: "Riff deleted successfully",
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error deleting riff:", error);
    return NextResponse.json(
      { error: "An error occurred while deleting the riff" },
      { status: 500 }
    );
  }
}
