import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// POST /api/pieces/[id]/shares — create a CLUB or PUBLIC share
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: pieceId } = await params;
    const { shareType, clubId } = await req.json();

    if (shareType !== "CLUB" && shareType !== "PUBLIC") {
      return NextResponse.json(
        { error: "shareType must be CLUB or PUBLIC" },
        { status: 400 }
      );
    }

    if (shareType === "CLUB" && !clubId) {
      return NextResponse.json(
        { error: "clubId is required for CLUB shares" },
        { status: 400 }
      );
    }

    // Verify piece exists and user is the author
    const piece = await prisma.piece.findUnique({
      where: { id: pieceId },
      include: {
        versions: { orderBy: { versionNumber: "desc" }, take: 1 },
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

    if (shareType === "CLUB") {
      // Verify author is a member of that club
      const membership = await prisma.clubMember.findFirst({
        where: { clubId, userId: user.id },
      });
      if (!membership) {
        return NextResponse.json(
          { error: "You must be a member of this club to share to it" },
          { status: 403 }
        );
      }

      // Prevent duplicate club share
      const existing = await prisma.share.findFirst({
        where: { pieceId, shareType: "CLUB", clubId },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Piece is already shared to this club" },
          { status: 400 }
        );
      }
    }

    if (shareType === "PUBLIC") {
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
    }

    // Create a PieceVersion snapshot to satisfy the required versionId field.
    // Readers always see piece.currentContent — this snapshot is a historical record only.
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
        shareType,
        clubId: shareType === "CLUB" ? clubId : null,
        isPublic: shareType === "PUBLIC",
        isVisible: true,
      },
      select: {
        id: true,
        shareType: true,
        clubId: true,
        isPublic: true,
        club: { select: { id: true, name: true } },
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
