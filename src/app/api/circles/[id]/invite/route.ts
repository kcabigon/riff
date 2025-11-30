import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// POST /api/circles/[id]/invite - Invite user to circle (ANY member can invite)
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const circleId = params.id;
    const { userId, role } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if requester is a member of the circle
    const requesterMembership = await prisma.circleMember.findFirst({
      where: {
        circleId,
        userId: (user as any).id,
      },
    });

    if (!requesterMembership) {
      return NextResponse.json(
        { error: "You must be a member of this circle to invite others" },
        { status: 403 }
      );
    }

    // Check if user being invited exists
    const invitedUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!invitedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingMembership = await prisma.circleMember.findFirst({
      where: {
        circleId,
        userId,
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "User is already a member of this circle" },
        { status: 400 }
      );
    }

    // Validate role if provided
    const assignedRole = role || "MEMBER";
    if (!["OWNER", "ADMIN", "MEMBER"].includes(assignedRole)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // Only OWNER can assign OWNER role
    if (assignedRole === "OWNER" && requesterMembership.role !== "OWNER") {
      return NextResponse.json(
        { error: "Only the circle owner can assign owner role" },
        { status: 403 }
      );
    }

    // Create membership
    const membership = await prisma.circleMember.create({
      data: {
        circleId,
        userId,
        role: assignedRole,
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

    return NextResponse.json({
      success: true,
      membership,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error inviting user to circle:", error);
    return NextResponse.json(
      { error: "An error occurred while inviting the user" },
      { status: 500 }
    );
  }
}
