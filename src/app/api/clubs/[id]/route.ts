import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { isCadenceValue } from "@/lib/cadence";

// GET /api/clubs/[id] - Get club details
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: clubId } = await params;

    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        moderator: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        members: {
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
        riffs: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                username: true,
                avatarUrl: true,
              },
            },
            _count: {
              select: {
                participants: true,
                pieces: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            shares: true,
          },
        },
      },
    });

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    // Check if user is a member
    const isMember = club.members.some((m) => m.userId === user.id);
    if (!isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ club });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error fetching club:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching the club" },
      { status: 500 }
    );
  }
}

// PATCH /api/clubs/[id] - Update club details
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: clubId } = await params;
    const { name, description, moderatorId, bannerImage, cadence } =
      await req.json();

    // Check if user is admin
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    const isAdminOrCoHost =
      club.adminId === user.id || club.moderatorId === user.id;

    if (!isAdminOrCoHost) {
      return NextResponse.json(
        { error: "Only the club admin or co-host can update club details" },
        { status: 403 }
      );
    }

    // Only the admin can assign/change the moderator
    if (moderatorId !== undefined && club.adminId !== user.id) {
      return NextResponse.json(
        { error: "Only the club admin can assign a co-host" },
        { status: 403 }
      );
    }

    // Validate input
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Club name cannot be empty" },
          { status: 400 }
        );
      }

      if (name.length > 100) {
        return NextResponse.json(
          { error: "Club name must be 100 characters or less" },
          { status: 400 }
        );
      }
    }

    if (cadence !== undefined && !isCadenceValue(cadence)) {
      return NextResponse.json({ error: "Invalid cadence" }, { status: 400 });
    }

    // If updating moderator, verify they are a member
    if (moderatorId !== undefined && moderatorId !== null) {
      const member = await prisma.clubMember.findFirst({
        where: {
          clubId,
          userId: moderatorId,
        },
      });

      if (!member) {
        return NextResponse.json(
          { error: "Moderator must be a club member" },
          { status: 400 }
        );
      }
    }

    // Update club
    const updatedClub = await prisma.club.update({
      where: { id: clubId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && {
          description: description?.trim() || null,
        }),
        ...(moderatorId !== undefined && { moderatorId }),
        ...(bannerImage !== undefined && { bannerImage }),
        ...(cadence !== undefined && { cadence }),
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        moderator: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        members: {
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
        },
      },
    });

    return NextResponse.json({
      success: true,
      club: updatedClub,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error updating club:", error);
    return NextResponse.json(
      { error: "An error occurred while updating the club" },
      { status: 500 }
    );
  }
}

// DELETE /api/clubs/[id] - Delete/Archive club
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: clubId } = await params;

    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    if (club.adminId !== user.id) {
      return NextResponse.json(
        { error: "Only the club admin can delete the club" },
        { status: 403 }
      );
    }

    // Archiving hides the club from every listing query, which would
    // otherwise strand any DRAFT/ACTIVE riff — it stays on members' home
    // pages (that query doesn't filter by club.isArchived) but the card's
    // link target (the club page) 404s. Clean those riffs up first: reveal
    // if someone submitted (worth keeping — mirrors the manual reveal
    // transition in PATCH /api/riffs/[id]), otherwise delete (nothing to
    // preserve). No notifications fired — this is a side effect of the
    // admin's archive action, not a standalone host action with its own
    // announcement.
    const strandedRiffs = await prisma.riff.findMany({
      where: { clubId, status: { in: ["DRAFT", "ACTIVE"] } },
      select: { id: true, status: true },
    });

    for (const riff of strandedRiffs) {
      const submittedCount = await prisma.pieceRiff.count({
        where: { riffId: riff.id, submittedAt: { not: null } },
      });

      if (riff.status === "ACTIVE" && submittedCount > 0) {
        await prisma.$transaction(async (tx) => {
          const revealedCount = await tx.riff.count({
            where: { clubId, status: { in: ["REVEALED", "COMPLETED"] } },
          });
          await tx.riff.update({
            where: { id: riff.id },
            data: { status: "REVEALED", volumeNumber: revealedCount + 1 },
          });
        });
      } else {
        await prisma.riff.delete({ where: { id: riff.id } });
      }
    }

    // Archive instead of hard delete
    await prisma.club.update({
      where: { id: clubId },
      data: { isArchived: true },
    });

    return NextResponse.json({
      success: true,
      message: "Club archived successfully",
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error deleting club:", error);
    return NextResponse.json(
      { error: "An error occurred while deleting the club" },
      { status: 500 }
    );
  }
}
