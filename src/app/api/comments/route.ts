import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/comments - List comments for a piece version
export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const pieceId = searchParams.get("pieceId");
    const versionId = searchParams.get("versionId");
    const circleId = searchParams.get("circleId");

    if (!pieceId || !versionId) {
      return NextResponse.json(
        { error: "Piece ID and version ID are required" },
        { status: 400 }
      );
    }

    // Check if user can view comments on this piece
    const version = await prisma.pieceVersion.findUnique({
      where: { id: versionId },
      include: {
        piece: true,
      },
    });

    if (!version || version.pieceId !== pieceId) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
      );
    }

    const isAuthor = version.piece.authorId === (user as any).id;

    // Build where clause
    const where: any = {
      pieceId,
      versionId,
    };

    if (circleId) {
      // Circle-specific comments
      if (!isAuthor) {
        // Verify user is member of circle
        const membership = await prisma.circleMember.findFirst({
          where: {
            circleId,
            userId: (user as any).id,
          },
        });

        if (!membership) {
          return NextResponse.json(
            { error: "You do not have permission to view these comments" },
            { status: 403 }
          );
        }
      }

      where.circleId = circleId;
    } else {
      // If not author, can only see circle comments where they're a member
      if (!isAuthor) {
        where.circle = {
          members: {
            some: {
              userId: (user as any).id,
            },
          },
        };
      }
    }

    const comments = await prisma.comment.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
        replies: {
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
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
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
