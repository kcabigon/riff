import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { notifyClubMembers } from "@/lib/notifications";
import { sendRiffCreatedEmail, sendRiffRevealedEmail } from "@/lib/resend";
import { NotificationType } from "@prisma/client";

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

    // Check if user is a club member
    const member = await prisma.clubMember.findFirst({
      where: {
        clubId: riff.clubId,
        userId: (user as any).id,
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Strip piece content before reveal — cover image still returned for locked card teaser
    if (riff.status !== "REVEALED") {
      (riff as any).pieces = riff.pieces.map((pr) => ({
        ...pr,
        piece: { ...pr.piece, currentContent: null },
      }));
    }

    return NextResponse.json({ riff });
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

    // Check permissions
    const member = await prisma.clubMember.findFirst({
      where: {
        clubId: riff.clubId,
        userId: (user as any).id,
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    // Only creator can update title, prompt, deadline
    if (
      (title || prompt || deadline !== undefined) &&
      riff.creatorId !== (user as any).id
    ) {
      return NextResponse.json(
        { error: "Only the riff creator can update riff details" },
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

      // Fetch club to check admin
      const club = await prisma.club.findUnique({
        where: { id: riff.clubId },
        select: { adminId: true },
      });

      const isClubAdmin = club?.adminId === (user as any).id;

      if (status === "ACTIVE" && riff.status === "DRAFT") {
        // Only creator can activate from DRAFT
        if (riff.creatorId !== (user as any).id) {
          return NextResponse.json(
            { error: "Only the riff creator can activate the riff" },
            { status: 403 }
          );
        }
      } else if (status === "REVEALED") {
        // Only club admin can reveal, and riff must be ACTIVE
        if (!isClubAdmin) {
          return NextResponse.json(
            { error: "Only the club admin can reveal pieces" },
            { status: 403 }
          );
        }
        if (riff.status !== "ACTIVE") {
          return NextResponse.json(
            { error: "Only active riffs can be revealed" },
            { status: 400 }
          );
        }
      } else if (status === "COMPLETED") {
        // Only club admin can complete
        if (!isClubAdmin) {
          return NextResponse.json(
            { error: "Only the club admin can complete a riff" },
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

    // Update riff — assign volumeNumber atomically at reveal time to prevent race conditions
    const updatedRiff = await prisma.$transaction(async (tx) => {
      let volumeNumber: number | undefined;
      if (status === "REVEALED" && riff.status === "ACTIVE") {
        const revealedCount = await tx.riff.count({
          where: {
            clubId: riff.clubId,
            status: { in: ["REVEALED", "COMPLETED"] },
          },
        });
        volumeNumber = revealedCount + 1;
      }

      return tx.riff.update({
        where: { id: riffId },
        data: {
          ...(title !== undefined && { title: title?.trim() || null }),
          ...(volumeNumber !== undefined && { volumeNumber }),
          ...(prompt !== undefined && { prompt: prompt?.trim() || null }),
          ...(deadline !== undefined && {
            deadline: deadline ? new Date(deadline) : null,
          }),
          ...(status !== undefined && { status }),
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

    // Fire notifications for status changes (non-blocking)
    if (status && status !== riff.status) {
      const actorId = (user as any).id;
      if (status === "ACTIVE") {
        notifyClubMembers(riff.clubId, NotificationType.RIFF_CREATED, actorId, {
          riffId,
        }).catch(() => {});

        // Send riff created emails to all club members except the creator
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const clubUrl = `${appUrl}/clubs/${riff.clubId}`;
        prisma.clubMember
          .findMany({
            where: { clubId: riff.clubId, userId: { not: actorId } },
            include: { user: { select: { email: true, name: true } } },
          })
          .then((members) =>
            Promise.allSettled(
              members.map((m) =>
                sendRiffCreatedEmail({
                  email: m.user.email,
                  actorName: updatedRiff.creator.name || "Your host",
                  clubName: updatedRiff.club.name,
                  clubUrl,
                  riffTitle: riff.title,
                  prompt: riff.prompt,
                  deadline: riff.deadline ?? null,
                })
              )
            )
          )
          .catch(() => {});
      } else if (status === "REVEALED") {
        notifyClubMembers(
          riff.clubId,
          NotificationType.RIFF_COMPLETED,
          actorId,
          { riffId }
        ).catch(() => {});

        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const riffUrl = `${appUrl}/riffs/${riffId}`;
        prisma.clubMember
          .findMany({
            where: { clubId: riff.clubId, userId: { not: actorId } },
            include: { user: { select: { email: true, name: true } } },
          })
          .then((members) =>
            Promise.allSettled(
              members.map((m) =>
                sendRiffRevealedEmail({
                  email: m.user.email,
                  clubName: updatedRiff.club.name,
                  riffUrl,
                  riffTitle: updatedRiff.title,
                  volumeNumber: updatedRiff.volumeNumber,
                  pieceCount: updatedRiff._count.pieces,
                })
              )
            )
          )
          .catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      riff: updatedRiff,
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

    // Only creator or club admin can delete
    const club = await prisma.club.findUnique({
      where: { id: riff.clubId },
    });

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    const canDelete =
      riff.creatorId === (user as any).id || club.adminId === (user as any).id;

    if (!canDelete) {
      return NextResponse.json(
        { error: "Only the riff creator or club admin can delete the riff" },
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
