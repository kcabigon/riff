import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// DELETE /api/pieces/[id]/shares/[shareId] — revoke a share
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; shareId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: pieceId, shareId } = await params;

    const piece = await prisma.piece.findUnique({
      where: { id: pieceId },
      select: { authorId: true },
    });

    if (!piece) {
      return NextResponse.json({ error: "Piece not found" }, { status: 404 });
    }

    if (piece.authorId !== user.id) {
      return NextResponse.json(
        { error: "Only the author can revoke shares" },
        { status: 403 }
      );
    }

    const share = await prisma.share.findUnique({
      where: { id: shareId },
      select: { pieceId: true },
    });

    if (!share || share.pieceId !== pieceId) {
      return NextResponse.json({ error: "Share not found" }, { status: 404 });
    }

    await prisma.share.delete({ where: { id: shareId } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error revoking share:", error);
    return NextResponse.json(
      { error: "An error occurred while revoking the share" },
      { status: 500 }
    );
  }
}
