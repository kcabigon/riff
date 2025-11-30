import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// POST /api/circles/[id]/remove - Remove member from circle (OWNER/ADMIN only)
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const circleId = params.id;
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if requester is OWNER or ADMIN
    const requesterMembership = await prisma.circleMember.findFirst({
      where: {
        circleId,
        userId: (user as any).id,
        role: { in: ["OWNER", "ADMIN"] },
      },
    });

    if (!requesterMembership) {
      return NextResponse.json(
        { error: "Only circle owners and admins can remove members" },
        { status: 403 }
      );
    }

    // Get the membership to be removed
    const membershipToRemove = await prisma.circleMember.findFirst({
      where: {
        circleId,
        userId,
      },
    });

    if (!membershipToRemove) {
      return NextResponse.json(
        { error: "User is not a member of this circle" },
        { status: 404 }
      );
    }

    // Cannot remove the OWNER
    if (membershipToRemove.role === "OWNER") {
      return NextResponse.json(
        { error: "Cannot remove the circle owner" },
        { status: 400 }
      );
    }

    // Only OWNER can remove ADMIN
    if (
      membershipToRemove.role === "ADMIN" &&
      requesterMembership.role !== "OWNER"
    ) {
      return NextResponse.json(
        { error: "Only the circle owner can remove admins" },
        { status: 403 }
      );
    }

    // Remove the membership
    await prisma.circleMember.delete({
      where: {
        id: membershipToRemove.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Member removed from circle",
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error removing member from circle:", error);
    return NextResponse.json(
      { error: "An error occurred while removing the member" },
      { status: 500 }
    );
  }
}
