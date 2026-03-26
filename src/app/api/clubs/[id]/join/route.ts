import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

// POST /api/clubs/[id]/join — Join a club via the public join link
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clubId } = await params;
    const user = await requireAuth();
    const userId = user.id;

    // Check club exists
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      select: { id: true },
    });

    if (!club) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    // Idempotent — return success if already a member
    const existing = await prisma.clubMember.findFirst({
      where: { clubId, userId },
    });

    if (existing) {
      return NextResponse.json({ success: true, alreadyMember: true });
    }

    // Create membership
    await prisma.clubMember.create({
      data: { clubId, userId },
    });

    // Update lastActiveClubId
    await prisma.user.update({
      where: { id: userId },
      data: { lastActiveClubId: clubId },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error joining club:", error);
    return NextResponse.json({ error: "Failed to join club" }, { status: 500 });
  }
}
