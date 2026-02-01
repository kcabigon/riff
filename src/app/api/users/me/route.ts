import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/users/me - Get current user info
export async function GET() {
  try {
    const user = await requireAuth();

    const currentUser = await prisma.user.findUnique({
      where: { id: (user as any).id },
      select: {
        id: true,
        lastActiveClubId: true,
        onboardingCompleted: true,
        onboardingStep: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: currentUser });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error fetching current user:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching user data" },
      { status: 500 }
    );
  }
}

// PATCH /api/users/me - Update current user's lastActiveClubId
export async function PATCH(req: Request) {
  try {
    const user = await requireAuth();
    const { lastActiveClubId } = await req.json();

    if (!lastActiveClubId) {
      return NextResponse.json(
        { error: "lastActiveClubId is required" },
        { status: 400 }
      );
    }

    // Verify user is a member of the club they're setting as active
    const member = await prisma.clubMember.findFirst({
      where: {
        clubId: lastActiveClubId,
        userId: (user as any).id,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "You are not a member of this club" },
        { status: 403 }
      );
    }

    await prisma.user.update({
      where: { id: (user as any).id },
      data: { lastActiveClubId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "An error occurred while updating user data" },
      { status: 500 }
    );
  }
}
