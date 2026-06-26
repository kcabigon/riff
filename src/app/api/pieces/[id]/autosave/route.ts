import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { extractExcerpt } from "@/lib/excerpt";

// PATCH /api/pieces/[id]/autosave - Auto-save piece content (author only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: pieceId } = await params;
    const {
      currentContent,
      title,
      subtitle,
      coverImage,
      wordCount,
      readLengthMin,
    } = await req.json();

    if (
      !currentContent &&
      title === undefined &&
      subtitle === undefined &&
      coverImage === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "At least one of currentContent, title, subtitle, or coverImage is required",
        },
        { status: 400 }
      );
    }

    // Check if user is the author
    const piece = await prisma.piece.findUnique({
      where: { id: pieceId },
    });

    if (!piece) {
      return NextResponse.json({ error: "Piece not found" }, { status: 404 });
    }

    if (piece.authorId !== user.id) {
      return NextResponse.json(
        { error: "Only the author can edit this piece" },
        { status: 403 }
      );
    }

    // Build dynamic update data — at least one field will be present
    const data: {
      currentContent?: string;
      currentExcerpt?: string | null;
      title?: string;
      subtitle?: string | null;
      coverImage?: string | null;
      wordCount?: number;
      readLengthMin?: number;
    } = {};
    if (currentContent) {
      data.currentContent = currentContent;
      const excerpt = extractExcerpt(currentContent);
      if (excerpt) data.currentExcerpt = excerpt;
    }
    if (title !== undefined) {
      data.title = title.trim() || "Untitled";
    }
    if (subtitle !== undefined) {
      data.subtitle = subtitle.trim() || null;
    }
    if (coverImage !== undefined) {
      data.coverImage = coverImage || null;
    }
    if (typeof wordCount === "number") {
      data.wordCount = wordCount;
      data.readLengthMin =
        readLengthMin ?? Math.max(1, Math.round(wordCount / 200));
    }

    const updatedPiece = await prisma.piece.update({
      where: { id: pieceId },
      data,
      select: {
        id: true,
        updatedAt: true,
      },
    });

    // Re-anchor comments when content changes (Google Docs behavior)
    if (currentContent) {
      const comments = await prisma.comment.findMany({
        where: {
          pieceId,
          selectedText: { not: null },
        },
        select: {
          id: true,
          selectedText: true,
          selectionStart: true,
        },
      });

      for (const comment of comments) {
        if (!comment.selectedText) continue;

        const newIndex = currentContent.indexOf(comment.selectedText);

        if (newIndex === -1) {
          // Text was deleted — remove comment (Google Docs behavior)
          await prisma.comment.delete({ where: { id: comment.id } });
        } else if (
          comment.selectionStart !== null &&
          newIndex !== comment.selectionStart
        ) {
          // Text moved — update anchors
          await prisma.comment.update({
            where: { id: comment.id },
            data: {
              selectionStart: newIndex,
              selectionEnd: newIndex + comment.selectedText.length,
            },
          });
        }
      }
    }

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
