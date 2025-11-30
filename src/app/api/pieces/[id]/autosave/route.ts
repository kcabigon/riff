import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// PATCH /api/pieces/[id]/autosave - Auto-save piece content (author only)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const pieceId = params.id;
    const { currentContent } = await req.json();

    if (!currentContent) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

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
        { error: "Only the author can edit this piece" },
        { status: 403 }
      );
    }

    // Auto-save just updates currentContent without updating title/excerpt
    // This is a lightweight save for draft content
    const updatedPiece = await prisma.piece.update({
      where: { id: pieceId },
      data: {
        currentContent,
      },
      select: {
        id: true,
        updatedAt: true,
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

    console.error("Error auto-saving piece:", error);
    return NextResponse.json(
      { error: "An error occurred while auto-saving the piece" },
      { status: 500 }
    );
  }
}
