import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { friendOfWhere } from "@/lib/friends";

// GET /api/pieces/[id] - Get piece details
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: pieceId } = await params;

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
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    if (!piece) {
      return NextResponse.json({ error: "Piece not found" }, { status: 404 });
    }

    // Check if user can view this piece
    const isAuthor = piece.authorId === user.id;

    if (!isAuthor) {
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: pieceId } = await params;
    const { title, content, excerpt } = await req.json();

    // Check if user is the author
    const piece = await prisma.piece.findUnique({
      where: { id: pieceId },
    });

    if (!piece) {
      return NextResponse.json({ error: "Piece not found" }, { status: 404 });
    }

    if (piece.authorId !== user.id) {
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
        ...(excerpt !== undefined && {
          currentExcerpt: excerpt?.trim() || null,
        }),
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: pieceId } = await params;
    const force = new URL(req.url).searchParams.get("force") === "true";

    // Check if user is the author
    const piece = await prisma.piece.findUnique({
      where: { id: pieceId },
    });

    if (!piece) {
      return NextResponse.json({ error: "Piece not found" }, { status: 404 });
    }

    if (piece.authorId !== user.id) {
      return NextResponse.json(
        { error: "Only the author can delete this piece" },
        { status: 403 }
      );
    }

    // Deleting cascades to any individual piece-invite shares, which are
    // also how those friendships were established (src/lib/friends.ts) —
    // warn before silently ending them. Only warn about people who'd
    // *actually* lose access, though — someone who joined via this piece
    // but is now also a club-mate or riff-mate stays a friend regardless.
    if (!force) {
      const shares = await prisma.share.findMany({
        where: { pieceId, shareType: "INDIVIDUAL" },
        select: { sharedWithId: true },
      });
      const sharedWithIds = shares
        .map((s) => s.sharedWithId)
        .filter((id): id is string => id !== null);

      if (sharedWithIds.length > 0) {
        const stillFriends = await prisma.user.findMany({
          where: {
            id: { in: sharedWithIds },
            ...friendOfWhere(user.id, { viaIndividualShare: false }),
          },
          select: { id: true },
        });
        const stillFriendIds = new Set(stillFriends.map((u) => u.id));
        const lostIds = sharedWithIds.filter((id) => !stillFriendIds.has(id));

        if (lostIds.length > 0) {
          const lostUsers = await prisma.user.findMany({
            where: { id: { in: lostIds } },
            select: { firstName: true, name: true, username: true },
          });
          const friendNames = lostUsers.map(
            (u) => u.firstName || u.name || u.username || "Someone"
          );

          return NextResponse.json(
            {
              error: `Deleting this piece will remove Friend-status for ${friendNames.length} ${friendNames.length === 1 ? "person" : "people"}.`,
              friendCount: friendNames.length,
              friendNames,
            },
            { status: 409 }
          );
        }
      }
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
