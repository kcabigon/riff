import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/pieces/[id] - Get piece details
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const pieceId = params.id;

    const piece = await prisma.piece.findUnique({
      where: { id: pieceId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
            bio: true,
          },
        },
        versions: {
          orderBy: {
            versionNumber: "desc",
          },
        },
        shares: {
          include: {
            circle: {
              select: {
                id: true,
                name: true,
              },
            },
            version: true,
            prompt: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    if (!piece) {
      return NextResponse.json(
        { error: "Piece not found" },
        { status: 404 }
      );
    }

    // Check if user can view this piece
    const isAuthor = piece.authorId === (user as any).id;
    const isSharedToUserCircle = piece.shares.some(async (share) => {
      const membership = await prisma.circleMember.findFirst({
        where: {
          circleId: share.circleId,
          userId: (user as any).id,
        },
      });
      return membership !== null;
    });

    if (!isAuthor && !isSharedToUserCircle) {
      return NextResponse.json(
        { error: "You do not have permission to view this piece" },
        { status: 403 }
      );
    }

    return NextResponse.json({ piece });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error fetching piece:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching the piece" },
      { status: 500 }
    );
  }
}

// PATCH /api/pieces/[id] - Update piece (author only)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const pieceId = params.id;
    const { title, content, excerpt } = await req.json();

    // Check if user is the author
    const piece = await prisma.piece.findUnique({
      where: { id: pieceId },
    });

    if (!piece) {
      return NextResponse.json(
        { error: "Piece not found" },
        { status: 404 }
      );
    }

    if (piece.authorId !== (user as any).id) {
      return NextResponse.json(
        { error: "Only the author can update this piece" },
        { status: 403 }
      );
    }

    // Validate inputs
    if (title !== undefined && title.trim().length === 0) {
      return NextResponse.json(
        { error: "Piece title cannot be empty" },
        { status: 400 }
      );
    }

    if (content !== undefined && content.trim().length === 0) {
      return NextResponse.json(
        { error: "Piece content cannot be empty" },
        { status: 400 }
      );
    }

    // Update piece
    const updatedPiece = await prisma.piece.update({
      where: { id: pieceId },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(content !== undefined && { currentContent: content }),
        ...(excerpt !== undefined && { currentExcerpt: excerpt?.trim() || null }),
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
      },
    });

    return NextResponse.json({
      success: true,
      piece: updatedPiece,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error updating piece:", error);
    return NextResponse.json(
      { error: "An error occurred while updating the piece" },
      { status: 500 }
    );
  }
}

// DELETE /api/pieces/[id] - Delete piece (author only)
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const pieceId = params.id;

    // Check if user is the author
    const piece = await prisma.piece.findUnique({
      where: { id: pieceId },
    });

    if (!piece) {
      return NextResponse.json(
        { error: "Piece not found" },
        { status: 404 }
      );
    }

    if (piece.authorId !== (user as any).id) {
      return NextResponse.json(
        { error: "Only the author can delete this piece" },
        { status: 403 }
      );
    }

    // Delete piece (cascades to versions, shares, comments)
    await prisma.piece.delete({
      where: { id: pieceId },
    });

    return NextResponse.json({
      success: true,
      message: "Piece deleted successfully",
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error deleting piece:", error);
    return NextResponse.json(
      { error: "An error occurred while deleting the piece" },
      { status: 500 }
    );
  }
}
