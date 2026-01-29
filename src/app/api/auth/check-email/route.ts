import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/auth/check-email
 * Check if email exists and return onboarding status
 * Public endpoint (no auth required)
 */
export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        onboardingCompleted: true,
        onboardingStep: true,
      },
    });

    if (!user) {
      // User doesn't exist - new user
      return NextResponse.json({
        exists: false,
        onboardingStep: null,
      });
    }

    // User exists - return onboarding status
    return NextResponse.json({
      exists: true,
      onboardingCompleted: user.onboardingCompleted,
      onboardingStep: user.onboardingStep,
    });
  } catch (error) {
    console.error("Error checking email:", error);
    return NextResponse.json(
      { error: "An error occurred while checking email" },
      { status: 500 }
    );
  }
}
