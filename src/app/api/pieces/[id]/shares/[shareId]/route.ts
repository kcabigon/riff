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

    const deleted = await prisma.share.deleteMany({
      where: {
        id: shareId,
        pieceId,
        piece: { authorId: user.id },
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Share not found" }, { status: 404 });
    }

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
