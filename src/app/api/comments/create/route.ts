import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const {
      content,
      pieceId,
      versionId,
      circleId,
      parentId,
      selectionStart,
      selectionEnd,
      selectedText,
    } = await req.json();

    // Validate input
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    if (!pieceId || !versionId) {
      return NextResponse.json(
        { error: "Piece ID and version ID are required" },
        { status: 400 }
      );
    }

    // Check if version exists
    const version = await prisma.pieceVersion.findUnique({
      where: { id: versionId },
      include: {
        piece: true,
      },
    });

    if (!version || version.pieceId !== pieceId) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
      );
    }

    // Check if user can comment on this piece
    const isAuthor = version.piece.authorId === (user as any).id;

    if (!isAuthor) {
      // If commenting in circle context, must be member
      if (circleId) {
        const membership = await prisma.circleMember.findFirst({
          where: {
            circleId,
            userId: (user as any).id,
          },
        });

        if (!membership) {
          return NextResponse.json(
            { error: "You must be a member of this circle to comment" },
            { status: 403 }
          );
        }

        // Check if piece is shared to this circle
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
      } else {
        // Direct comment - check if piece is accessible
        return NextResponse.json(
          { error: "You do not have permission to comment on this piece" },
          { status: 403 }
        );
      }
    }

    // If replying to another comment, verify parent exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment || parentComment.pieceId !== pieceId) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        pieceId,
        versionId,
        circleId: circleId || null,
        authorId: (user as any).id,
        parentId: parentId || null,
        selectionStart: selectionStart || null,
        selectionEnd: selectionEnd || null,
        selectedText: selectedText || null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        comment,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the comment" },
      { status: 500 }
    );
  }
}
