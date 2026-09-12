import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { RiffStatus, type Prisma } from "@prisma/client";

// GET /api/pieces - List pieces with filters
export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);

    const authorId = searchParams.get("authorId");
    const revealedOnly = searchParams.get("revealed") === "true";

    // Same eligibility rule as the shares/join routes — a piece can only be
    // used to invite someone (or made public) once it's actually revealed.
    const revealedFilter: Prisma.PieceWhereInput = revealedOnly
      ? {
          OR: [
            { publishedAt: { not: null } },
            {
              riffs: {
                some: {
                  submittedAt: { not: null },
                  riff: {
                    status: {
                      in: [RiffStatus.REVEALED, RiffStatus.COMPLETED],
                    },
                  },
                },
              },
            },
          ],
        }
      : {};

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
        where: { authorId, ...revealedFilter },
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
          ...revealedFilter,
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
