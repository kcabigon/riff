import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/pieces - List pieces with filters
export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);

    const authorId = searchParams.get("authorId");
    const circleId = searchParams.get("circleId");

    let pieces;

    if (circleId) {
      // List pieces shared to a specific circle (user must be member)
      const membership = await prisma.circleMember.findFirst({
        where: {
          circleId,
          userId: (user as any).id,
        },
      });

      if (!membership) {
        return NextResponse.json(
          { error: "You are not a member of this circle" },
          { status: 403 }
        );
      }

      pieces = await prisma.piece.findMany({
        where: {
          shares: {
            some: {
              circleId,
              isVisible: true,
            },
          },
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
          shares: {
            where: { circleId },
            include: {
              version: true,
              prompt: true,
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
    } else if (authorId) {
      // List pieces by specific author
      // Only show if requesting own pieces or pieces shared to user's circles
      const canView =
        authorId === (user as any).id ||
        (await prisma.piece.findFirst({
          where: {
            authorId,
            shares: {
              some: {
                circle: {
                  members: {
                    some: {
                      userId: (user as any).id,
                    },
                  },
                },
              },
            },
          },
        })) !== null;

      if (!canView && authorId !== (user as any).id) {
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
              shares: true,
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
          authorId: (user as any).id,
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
              shares: true,
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
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error fetching pieces:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching pieces" },
      { status: 500 }
    );
  }
}
