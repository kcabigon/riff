import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/pieces - List pieces with filters
export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);

    const authorId = searchParams.get("authorId");

    let pieces;

    if (authorId) {
      // List pieces by specific author (only own pieces)
      if (authorId !== user.id) {
        return NextResponse.json(
          { error: "You do not have permission to view these pieces" },
          { status: 403 }
        );
      }

      pieces = await prisma.piece.findMany({
        where: { authorId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              versions: true,
              comments: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
    } else {
      // List user's own pieces by default
      pieces = await prisma.piece.findMany({
        where: {
          authorId: user.id,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              versions: true,
              comments: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
    }

    return NextResponse.json({ pieces });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error fetching pieces:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching pieces" },
      { status: 500 }
    );
  }
}
