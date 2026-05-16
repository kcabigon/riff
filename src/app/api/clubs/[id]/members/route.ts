import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// POST /api/clubs/[id]/members - Invite user to club
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: clubId } = await params;
    const { userId, role } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if club exists and user has permission
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        members: true,
      },
    });

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    // Check if requester is admin or moderator
    const requesterMember = club.members.find((m) => m.userId === user.id);
    if (
      !requesterMember ||
      !["ADMIN", "MODERATOR"].includes(requesterMember.role)
    ) {
      return NextResponse.json(
        { error: "Only admin or moderator can invite members" },
        { status: 403 }
      );
    }

    // Check if user is already a member
    const existingMember = club.members.find((m) => m.userId === userId);
    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member" },
        { status: 400 }
      );
    }

    // Verify invited user exists
    const invitedUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!invitedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only admin can assign MODERATOR role
    const memberRole =
      role === "MODERATOR" && requesterMember.role === "ADMIN"
        ? "MODERATOR"
        : "MEMBER";

    // Add member to club
    const newMember = await prisma.clubMember.create({
      data: {
        clubId,
        userId,
        role: memberRole,
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

    return NextResponse.json(
      {
        success: true,
        member: newMember,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error inviting member:", error);
    return NextResponse.json(
      { error: "An error occurred while inviting the member" },
      { status: 500 }
    );
  }
}
