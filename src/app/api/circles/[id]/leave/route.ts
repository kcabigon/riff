import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// POST /api/circles/[id]/leave - Leave a circle
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const circleId = params.id;

    // Get user's membership
    const membership = await prisma.circleMember.findFirst({
      where: {
        circleId,
        userId: (user as any).id,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this circle" },
        { status: 404 }
      );
    }

    // OWNER cannot leave - must transfer ownership or archive circle
    if (membership.role === "OWNER") {
      return NextResponse.json(
        {
          error:
            "Circle owner cannot leave. Transfer ownership or archive the circle first.",
        },
        { status: 400 }
      );
    }

    // Remove the membership
    await prisma.circleMember.delete({
      where: {
        id: membership.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "You have left the circle",
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error leaving circle:", error);
    return NextResponse.json(
      { error: "An error occurred while leaving the circle" },
      { status: 500 }
    );
  }
}
