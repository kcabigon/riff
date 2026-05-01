import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const userId = user.id;
    const {
      content,
      pieceId,
      riffId,
      clubId,
      selectionStart,
      selectionEnd,
      selectedText,
      parentId,
    } = await req.json();

    // Validate required fields
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    if (!pieceId || !riffId || !clubId) {
      return NextResponse.json(
        { error: "pieceId, riffId, and clubId are required" },
        { status: 400 }
      );
    }

    if (
      !parentId &&
      (selectionStart === undefined ||
        selectionEnd === undefined ||
        !selectedText)
    ) {
      return NextResponse.json(
        {
          error:
            "selectionStart, selectionEnd, and selectedText are required — all comments must be anchored to a text selection",
        },
        { status: 400 }
      );
    }

    // If reply, validate parent exists and belongs to the same piece
    let parentAuthorId: string | null = null;
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { authorId: true, pieceId: true },
      });
      if (!parentComment || parentComment.pieceId !== pieceId) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }
      parentAuthorId = parentComment.authorId;
    }

    // Verify piece exists and get author
    const piece = await prisma.piece.findUnique({
      where: { id: pieceId },
      select: { id: true, authorId: true },
    });

    if (!piece) {
      return NextResponse.json({ error: "Piece not found" }, { status: 404 });
    }

    // Auth: user must be a riff participant OR the piece author
    const isAuthor = piece.authorId === userId;

    if (!isAuthor) {
      const isParticipant = await prisma.riffParticipant.findUnique({
        where: { riffId_userId: { riffId, userId } },
        select: { id: true },
      });

      if (!isParticipant) {
        // Also allow club members who have read access (riff is REVEALED)
        const isMember = await prisma.clubMember.findFirst({
          where: { clubId, userId },
          select: { id: true },
        });

        if (!isMember) {
          return NextResponse.json(
            {
              error: "You must be a riff participant or club member to comment",
            },
            { status: 403 }
          );
        }
      }
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        pieceId,
        riffId,
        clubId,
        authorId: userId,
        selectionStart: parentId ? null : selectionStart,
        selectionEnd: parentId ? null : selectionEnd,
        selectedText: parentId ? null : selectedText,
        parentId: parentId ?? null,
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

    // Notify — reply goes to parent author, top-level goes to piece author
    try {
      if (parentId && parentAuthorId && parentAuthorId !== userId) {
        await prisma.notification.create({
          data: {
            type: "COMMENT_REPLY",
            recipientId: parentAuthorId,
            actorId: userId,
            pieceId,
            commentId: comment.id,
            clubId,
            riffId,
          },
        });
      } else if (!parentId && piece.authorId !== userId) {
        const existing = await prisma.notification.findFirst({
          where: {
            type: "NEW_COMMENT",
            recipientId: piece.authorId,
            pieceId,
            isRead: false,
          },
        });
        if (!existing) {
          await prisma.notification.create({
            data: {
              type: "NEW_COMMENT",
              recipientId: piece.authorId,
              actorId: userId,
              pieceId,
              commentId: comment.id,
              clubId,
              riffId,
            },
          });
        }
      }
    } catch (notifyErr) {
      console.error("Failed to send notification:", notifyErr);
    }

    return NextResponse.json({ success: true, comment }, { status: 201 });
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
