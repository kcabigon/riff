import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// POST /api/pieces/[id]/shares — create a PUBLIC share
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: pieceId } = await params;
    const { shareType } = await req.json();

    if (shareType !== "PUBLIC") {
      return NextResponse.json(
        { error: "Only PUBLIC shareType is supported" },
        { status: 400 }
      );
    }

    // Verify piece exists, user is the author, and it's been revealed
    const piece = await prisma.piece.findUnique({
      where: { id: pieceId },
      include: {
        versions: { orderBy: { versionNumber: "desc" }, take: 1 },
        riffs: {
          where: { submittedAt: { not: null } },
          select: { riff: { select: { status: true } } },
        },
      },
    });

    if (!piece) {
      return NextResponse.json({ error: "Piece not found" }, { status: 404 });
    }

    if (piece.authorId !== user.id) {
      return NextResponse.json(
        { error: "Only the author can share this piece" },
        { status: 403 }
      );
    }

    const isRevealed = piece.riffs.some(
      (r) => r.riff.status === "REVEALED" || r.riff.status === "COMPLETED"
    );

    if (!isRevealed) {
      return NextResponse.json(
        { error: "Only revealed pieces can be shared publicly" },
        { status: 403 }
      );
    }

    // Prevent duplicate public share
    const existing = await prisma.share.findFirst({
      where: { pieceId, shareType: "PUBLIC" },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Piece is already public" },
        { status: 400 }
      );
    }

    // Create a PieceVersion snapshot (required by Share schema)
    const nextVersionNumber = (piece.versions[0]?.versionNumber ?? 0) + 1;
    const version = await prisma.pieceVersion.create({
      data: {
        pieceId,
        versionNumber: nextVersionNumber,
        title: piece.title,
        content: piece.currentContent,
        excerpt: piece.currentExcerpt,
      },
    });

    const share = await prisma.share.create({
      data: {
        pieceId,
        versionId: version.id,
        shareType: "PUBLIC",
        isPublic: true,
        isVisible: true,
      },
      select: {
        id: true,
        shareType: true,
        isPublic: true,
      },
    });

    return NextResponse.json({ success: true, share }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating share:", error);
    return NextResponse.json(
      { error: "An error occurred while sharing the piece" },
      { status: 500 }
    );
  }
}
