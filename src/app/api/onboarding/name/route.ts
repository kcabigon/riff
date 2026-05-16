import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/onboarding/name
 * Save user's first and last name during onboarding
 */
export async function PATCH(req: Request) {
  try {
    const user = await requireAuth();
    const { firstName, lastName } = await req.json();

    // Validate input
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
    }

    if (firstName.length > 50 || lastName.length > 50) {
      return NextResponse.json(
        { error: "Names must be 50 characters or less" },
        { status: 400 }
      );
    }

    // Generate username from first name + random number
    const randomNum = Math.floor(Math.random() * 10000);
    const username = `${firstName.toLowerCase()}${randomNum}`;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`, // Full name for compatibility
        username: username,
        onboardingStep: "CLUB_CHOICE", // Progress to next step
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        onboardingStep: true,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error saving name:", error);
    return NextResponse.json(
      { error: "An error occurred while saving your name" },
      { status: 500 }
    );
  }
}
