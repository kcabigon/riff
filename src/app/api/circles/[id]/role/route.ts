import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// PATCH /api/circles/[id]/role - Update member role (OWNER only)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const circleId = params.id;
    const { userId, role } = await req.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: "User ID and role are required" },
        { status: 400 }
      );
    }

    // Validate role
    if (!["OWNER", "ADMIN", "MEMBER"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // Check if requester is OWNER
    const requesterMembership = await prisma.circleMember.findFirst({
      where: {
        circleId,
        userId: (user as any).id,
        role: "OWNER",
      },
    });

    if (!requesterMembership) {
      return NextResponse.json(
        { error: "Only the circle owner can update member roles" },
        { status: 403 }
      );
    }

    // Get the membership to update
    const membershipToUpdate = await prisma.circleMember.findFirst({
      where: {
        circleId,
        userId,
      },
    });

    if (!membershipToUpdate) {
      return NextResponse.json(
        { error: "User is not a member of this circle" },
        { status: 404 }
      );
    }

    // If changing to OWNER role, transfer ownership
    if (role === "OWNER") {
      // Update new owner
      await prisma.circleMember.update({
        where: { id: membershipToUpdate.id },
        data: { role: "OWNER" },
      });

      // Demote current owner to ADMIN
      await prisma.circleMember.update({
        where: { id: requesterMembership.id },
        data: { role: "ADMIN" },
      });

      return NextResponse.json({
        success: true,
        message: "Ownership transferred successfully",
      });
    }

    // Update role (ADMIN or MEMBER)
    const updatedMembership = await prisma.circleMember.update({
      where: { id: membershipToUpdate.id },
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

    return NextResponse.json({
      success: true,
      membership: updatedMembership,
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
