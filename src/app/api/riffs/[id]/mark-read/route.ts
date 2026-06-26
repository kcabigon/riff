import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// POST /api/riffs/[id]/mark-read — bulk-update readAt for all pieces the user has read on this riff
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: riffId } = await params;

    const riff = await prisma.riff.findUnique({
      where: { id: riffId },
      select: {
        status: true,
        club: {
          select: {
            members: { where: { userId: user.id }, select: { id: true } },
          },
        },
      },
    });

    if (!riff) {
      return NextResponse.json({ error: "Riff not found" }, { status: 404 });
    }
    if (riff.club.members.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (riff.status !== "REVEALED") {
      return NextResponse.json(
        { error: "Riff not yet revealed" },
        { status: 403 }
      );
    }

    await prisma.pieceRead.updateMany({
      where: { riffId, userId: user.id },
      data: { readAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error marking riff as read:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
