import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/comments?pieceId=&riffId= - List comments for a piece in a riff context
export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const userId = (user as any).id;
    const { searchParams } = new URL(req.url);
    const pieceId = searchParams.get("pieceId");
    const riffId = searchParams.get("riffId");

    if (!pieceId || !riffId) {
      return NextResponse.json(
        { error: "pieceId and riffId are required" },
        { status: 400 }
      );
    }

    // Verify the riff exists and user is a club member
    const riff = await prisma.riff.findUnique({
      where: { id: riffId },
      select: {
        clubId: true,
        club: {
          select: {
            members: {
              where: { userId },
              select: { id: true },
            },
          },
        },
      },
    });

    if (!riff) {
      return NextResponse.json({ error: "Riff not found" }, { status: 404 });
    }

    if (riff.club.members.length === 0) {
      return NextResponse.json(
        { error: "You must be a club member to view comments" },
        { status: 403 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: { pieceId, riffId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { selectionStart: "asc" },
    });

    return NextResponse.json({ comments });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching comments" },
      { status: 500 }
    );
  }
}
