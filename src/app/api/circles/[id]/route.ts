import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/circles/[id] - Get circle details
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const circleId = params.id;

    // Check if user is a member of the circle
    const membership = await prisma.circleMember.findFirst({
      where: {
        circleId,
        userId: (user as any).id,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this circle" },
        { status: 403 }
      );
    }

    const circle = await prisma.circle.findUnique({
      where: { id: circleId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatarUrl: true,
                bio: true,
              },
            },
          },
          orderBy: {
            joinedAt: "asc",
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        _count: {
          select: {
            pieces: true,
            prompts: true,
          },
        },
      },
    });

    if (!circle) {
      return NextResponse.json(
        { error: "Circle not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ circle });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error fetching circle:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching the circle" },
      { status: 500 }
    );
  }
}

// PATCH /api/circles/[id] - Update circle details (OWNER/ADMIN only)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const circleId = params.id;
    const { name, description, isArchived } = await req.json();

    // Check if user is OWNER or ADMIN
    const membership = await prisma.circleMember.findFirst({
      where: {
        circleId,
        userId: (user as any).id,
        role: { in: ["OWNER", "ADMIN"] },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Only circle owners and admins can update circle details" },
        { status: 403 }
      );
    }

    // If archiving, only OWNER can do it
    if (isArchived !== undefined && membership.role !== "OWNER") {
      return NextResponse.json(
        { error: "Only the circle owner can archive the circle" },
        { status: 403 }
      );
    }

    // Validate name if provided
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Circle name cannot be empty" },
          { status: 400 }
        );
      }

      if (name.length > 100) {
        return NextResponse.json(
          { error: "Circle name must be 100 characters or less" },
          { status: 400 }
        );
      }
    }

    // Update circle
    const updatedCircle = await prisma.circle.update({
      where: { id: circleId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isArchived !== undefined && { isArchived }),
      },
      include: {
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
      circle: updatedCircle,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error updating circle:", error);
    return NextResponse.json(
      { error: "An error occurred while updating the circle" },
      { status: 500 }
    );
  }
}
