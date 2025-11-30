import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// POST /api/pieces/[id]/share - Share piece to circle
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const pieceId = params.id;
    const { circleId, promptId } = await req.json();

    if (!circleId) {
      return NextResponse.json(
        { error: "Circle ID is required" },
        { status: 400 }
      );
    }

    // Check if user is the author
    const piece = await prisma.piece.findUnique({
      where: { id: pieceId },
      include: {
        versions: {
          orderBy: {
            versionNumber: "desc",
          },
          take: 1,
        },
      },
    });

    if (!piece) {
      return NextResponse.json(
        { error: "Piece not found" },
        { status: 404 }
      );
    }

    if (piece.authorId !== (user as any).id) {
      return NextResponse.json(
        { error: "Only the author can share this piece" },
        { status: 403 }
      );
    }

    // Check if user is a member of the circle
    const membership = await prisma.circleMember.findFirst({
      where: {
        circleId,
        userId: (user as any).id,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You must be a member of this circle to share to it" },
        { status: 403 }
      );
    }

    // Check if piece is already shared to this circle
    const existingShare = await prisma.pieceShare.findFirst({
      where: {
        pieceId,
        circleId,
      },
    });

    if (existingShare) {
      return NextResponse.json(
        { error: "Piece is already shared to this circle" },
        { status: 400 }
      );
    }

    // Create new version (frozen snapshot)
    const nextVersionNumber = (piece.versions[0]?.versionNumber || 0) + 1;
    const version = await prisma.pieceVersion.create({
      data: {
        pieceId,
        versionNumber: nextVersionNumber,
        title: piece.title,
        content: piece.currentContent,
        excerpt: piece.currentExcerpt,
      },
    });

    // Create share
    const share = await prisma.pieceShare.create({
      data: {
        pieceId,
        circleId,
        versionId: version.id,
        promptId: promptId || null,
        isVisible: true, // TODO: Apply visibility rules based on prompt
      },
      include: {
        version: true,
        circle: {
          select: {
            id: true,
            name: true,
          },
        },
        prompt: true,
      },
    });

    return NextResponse.json({
      success: true,
      share,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error sharing piece:", error);
    return NextResponse.json(
      { error: "An error occurred while sharing the piece" },
      { status: 500 }
    );
  }
}
