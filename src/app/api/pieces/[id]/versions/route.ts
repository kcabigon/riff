import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/pieces/[id]/versions - List all versions of a piece
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const pieceId = params.id;

    // Check if user can view this piece
    const piece = await prisma.piece.findUnique({
      where: { id: pieceId },
    });

    if (!piece) {
      return NextResponse.json(
        { error: "Piece not found" },
        { status: 404 }
      );
    }

    const isAuthor = piece.authorId === (user as any).id;

    // If not author, check if piece is shared to user's circles
    if (!isAuthor) {
      const sharedToUserCircle = await prisma.pieceShare.findFirst({
        where: {
          pieceId,
          circle: {
            members: {
              some: {
                userId: (user as any).id,
              },
            },
          },
        },
      });

      if (!sharedToUserCircle) {
        return NextResponse.json(
          { error: "You do not have permission to view this piece" },
          { status: 403 }
        );
      }
    }

    // Get versions
    const versions = await prisma.pieceVersion.findMany({
      where: { pieceId },
      include: {
        shares: {
          include: {
            circle: {
              select: {
                id: true,
                name: true,
              },
            },
            prompt: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        versionNumber: "desc",
      },
    });

    return NextResponse.json({ versions });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error fetching versions:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching versions" },
      { status: 500 }
    );
  }
}
