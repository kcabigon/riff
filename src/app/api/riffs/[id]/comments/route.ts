import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/riffs/[id]/comments — all top-level comments + replies for a revealed riff
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: riffId } = await params;

    const riff = await prisma.riff.findUnique({
      where: { id: riffId },
      select: {
        clubId: true,
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

    const rawComments = await prisma.comment.findMany({
      where: { riffId, parentId: null },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        piece: { select: { id: true, title: true } },
        replies: {
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    const comments = rawComments.sort((a, b) => {
      const aLatest =
        a.replies.length > 0
          ? Math.max(
              new Date(a.createdAt).getTime(),
              new Date(a.replies[a.replies.length - 1].createdAt).getTime()
            )
          : new Date(a.createdAt).getTime();
      const bLatest =
        b.replies.length > 0
          ? Math.max(
              new Date(b.createdAt).getTime(),
              new Date(b.replies[b.replies.length - 1].createdAt).getTime()
            )
          : new Date(b.createdAt).getTime();
      return bLatest - aLatest;
    });

    return NextResponse.json({ comments });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching riff comments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
