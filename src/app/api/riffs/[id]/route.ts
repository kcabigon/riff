import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

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

    // Only creator can update title, prompt, deadline
    if ((title || prompt || deadline !== undefined) && riff.creatorId !== (user as any).id) {
      return NextResponse.json(
        { error: "Only the riff creator can update riff details" },
        { status: 403 }
      );
    }

    // Any club member can mark riff as COMPLETED
    if (status && status !== riff.status) {
      if (status === "COMPLETED") {
        // Any member can complete
      } else if (status === "ACTIVE" && riff.creatorId !== (user as any).id) {
        return NextResponse.json(
          { error: "Only the riff creator can activate the riff" },
          { status: 403 }
        );
      } else if (!["DRAFT", "ACTIVE", "COMPLETED"].includes(status)) {
        return NextResponse.json(
          { error: "Invalid riff status" },
          { status: 400 }
        );
      }
    }

    // Validate input
    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        return NextResponse.json(
          { error: "Riff title cannot be empty" },
          { status: 400 }
        );
      }

      if (title.length > 200) {
        return NextResponse.json(
          { error: "Riff title must be 200 characters or less" },
          { status: 400 }
        );
      }
    }

    // Update riff
    const updatedRiff = await prisma.riff.update({
      where: { id: riffId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
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
