import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// PATCH /api/pieces/[id]/profile-visibility - Hide or unhide a piece on the
// author's profile. Display only: who can open the piece doesn't change.
// "Hidden" is a PieceVisibilitySettings row with visibility PRIVATE — reusing
// the Circle-era table so this needs no migration.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { hidden } = body ?? {};

    if (typeof hidden !== "boolean") {
      return NextResponse.json(
        { error: "hidden must be true or false" },
        { status: 400 }
      );
    }

    const piece = await prisma.piece.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!piece) {
      return NextResponse.json({ error: "Piece not found" }, { status: 404 });
    }

    if (piece.authorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (hidden) {
      await prisma.pieceVisibilitySettings.upsert({
        where: { pieceId: id },
        create: { pieceId: id, visibility: "PRIVATE" },
        update: { visibility: "PRIVATE" },
      });
    } else {
      await prisma.pieceVisibilitySettings.deleteMany({
        where: { pieceId: id },
      });
    }

    return NextResponse.json({ hidden });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating profile visibility:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
