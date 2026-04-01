import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/onboarding/complete
 * Update onboarding step or mark as completed
 */
export async function PATCH(req: Request) {
  try {
    const user = await requireAuth();
    const { step, clubId } = await req.json();

    // Validate step
    const validSteps = ["NAME", "CLUB_CHOICE", "INVITE", "COMPLETED"];
    if (step && !validSteps.includes(step)) {
      return NextResponse.json({ error: "Invalid step" }, { status: 400 });
    }

    const updateData: any = {};

    if (step) {
      updateData.onboardingStep = step;
    }

    if (step === "COMPLETED") {
      updateData.onboardingCompleted = true;
    }

    if (clubId) {
      updateData.lastActiveClubId = clubId;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        onboardingStep: true,
        onboardingCompleted: true,
        lastActiveClubId: true,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error updating onboarding:", error);
    return NextResponse.json(
      { error: "An error occurred while updating onboarding status" },
      { status: 500 }
    );
  }
}
