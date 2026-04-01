import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// PATCH /api/clubs/[id]/members/[userId] - Update member role
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: clubId, userId: targetUserId } = await params;
    const { role } = await req.json();

    if (!role || !["ADMIN", "MODERATOR", "MEMBER"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check if club exists
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        members: true,
      },
    });

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    // Only admin can change roles
    if (club.adminId !== user.id) {
      return NextResponse.json(
        { error: "Only the club admin can change member roles" },
        { status: 403 }
      );
    }

    // Cannot change admin role
    if (role === "ADMIN") {
      return NextResponse.json(
        { error: "Cannot change admin role. Admin is permanent." },
        { status: 400 }
      );
    }

    // Find target member
    const targetMember = club.members.find((m) => m.userId === targetUserId);
    if (!targetMember) {
      return NextResponse.json(
        { error: "User is not a member of this club" },
        { status: 404 }
      );
    }

    // Cannot change admin's role
    if (targetMember.userId === club.adminId) {
      return NextResponse.json(
        { error: "Cannot change the admin's role" },
        { status: 400 }
      );
    }

    // Update member role
    const updatedMember = await prisma.clubMember.update({
      where: { id: targetMember.id },
      data: { role },
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

    // If promoting to moderator, update club's moderatorId
    if (role === "MODERATOR") {
      await prisma.club.update({
        where: { id: clubId },
        data: { moderatorId: targetUserId },
      });
    } else if (club.moderatorId === targetUserId) {
      // If demoting current moderator, remove moderatorId
      await prisma.club.update({
        where: { id: clubId },
        data: { moderatorId: null },
      });
    }

    return NextResponse.json({
      success: true,
      member: updatedMember,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error updating member role:", error);
    return NextResponse.json(
      { error: "An error occurred while updating the member role" },
      { status: 500 }
    );
  }
}

// DELETE /api/clubs/[id]/members/[userId] - Remove member from club
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: clubId, userId: targetUserId } = await params;

    // Check if club exists
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        members: true,
      },
    });

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    // Find target member
    const targetMember = club.members.find((m) => m.userId === targetUserId);
    if (!targetMember) {
      return NextResponse.json(
        { error: "User is not a member of this club" },
        { status: 404 }
      );
    }

    // Check permissions
    const requesterMember = club.members.find((m) => m.userId === user.id);

    // User can remove themselves, or admin/moderator can remove others
    const canRemove =
      targetUserId === user.id ||
      (requesterMember &&
        ["ADMIN", "MODERATOR"].includes(requesterMember.role));

    if (!canRemove) {
      return NextResponse.json(
        { error: "You don't have permission to remove this member" },
        { status: 403 }
      );
    }

    // Cannot remove the admin
    if (targetUserId === club.adminId) {
      return NextResponse.json(
        { error: "Cannot remove the club admin" },
        { status: 400 }
      );
    }

    // Remove member
    await prisma.clubMember.delete({
      where: { id: targetMember.id },
    });

    // If removed member was moderator, clear moderatorId
    if (club.moderatorId === targetUserId) {
      await prisma.club.update({
        where: { id: clubId },
        data: { moderatorId: null },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "An error occurred while removing the member" },
      { status: 500 }
    );
  }
}
