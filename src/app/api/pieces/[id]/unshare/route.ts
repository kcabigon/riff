import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// POST /api/pieces/[id]/unshare - Unshare piece from circle (author only)
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const pieceId = params.id;
    const { circleId } = await req.json();

    if (!circleId) {
      return NextResponse.json(
        { error: "Circle ID is required" },
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
        { error: "Only the author can unshare this piece" },
        { status: 403 }
      );
    }

    // Find the share
    const share = await prisma.pieceShare.findFirst({
      where: {
        pieceId,
        circleId,
      },
    });

    if (!share) {
      return NextResponse.json(
        { error: "Piece is not shared to this circle" },
        { status: 404 }
      );
    }

    // Delete the share
    await prisma.pieceShare.delete({
      where: { id: share.id },
    });

    return NextResponse.json({
      success: true,
      message: "Piece unshared from circle",
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error unsharing piece:", error);
    return NextResponse.json(
      { error: "An error occurred while unsharing the piece" },
      { status: 500 }
    );
  }
}
