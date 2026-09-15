import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// PATCH /api/pieces/[id]/publish - Publish a riff-less draft (set publishedAt)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { publishedAt } = body ?? {};

    let publishDate = new Date();
    if (publishedAt) {
      const parsed = new Date(publishedAt);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json(
          { error: "Invalid publish date" },
          { status: 400 }
        );
      }
      publishDate = parsed;
    }

    const piece = await prisma.piece.findUnique({
      where: { id },
      select: {
        authorId: true,
        publishedAt: true,
        riffs: { select: { id: true }, take: 1 },
      },
    });

    if (!piece) {
      return NextResponse.json({ error: "Piece not found" }, { status: 404 });
    }

    if (piece.authorId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (piece.riffs.length > 0) {
      return NextResponse.json(
        { error: "Piece is attached to a riff — submit it instead" },
        { status: 400 }
      );
    }

    if (piece.publishedAt) {
      return NextResponse.json(
        { error: "Piece is already published" },
        { status: 400 }
      );
    }

    const updated = await prisma.piece.update({
      where: { id },
      data: { publishedAt: publishDate },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error publishing piece:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
