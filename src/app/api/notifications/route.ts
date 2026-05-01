import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/notifications - List notifications for current user
export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const userId = user.id;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { recipientId: userId, isRead: false },
        include: {
          actor: {
            select: { id: true, name: true, username: true, avatarUrl: true },
          },
          club: { select: { id: true, name: true } },
          riff: {
            select: { id: true, title: true, clubId: true, volumeNumber: true },
          },
          piece: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({
        where: { recipientId: userId, isRead: false },
      }),
    ]);

    // Count comments per piece anchored to the exact triggering comment's createdAt
    const commentNotifs = notifications.filter(
      (n) => n.type === "NEW_COMMENT" && n.pieceId && n.commentId
    );
    const commentCountMap = new Map<string, number>();
    if (commentNotifs.length > 0) {
      // Look up each notification's triggering comment to get the exact anchor timestamp
      const anchorCommentIds = commentNotifs.map((n) => n.commentId!);
      const anchorComments = await prisma.comment.findMany({
        where: { id: { in: anchorCommentIds } },
        select: { id: true, createdAt: true },
      });
      const anchorById = new Map(
        anchorComments.map((c) => [c.id, c.createdAt])
      );

      // Count per piece from its own anchor (parallel, typically 1-3 pieces)
      await Promise.all(
        commentNotifs.map(async (n) => {
          const anchorTime = anchorById.get(n.commentId!);
          if (!anchorTime || !n.pieceId) return;
          const count = await prisma.comment.count({
            where: {
              pieceId: n.pieceId,
              authorId: { not: userId },
              createdAt: { gte: anchorTime },
            },
          });
          commentCountMap.set(n.pieceId, count);
        })
      );
    }

    const enriched = notifications.map((n) => ({
      ...n,
      commentCount:
        n.type === "NEW_COMMENT" && n.pieceId
          ? (commentCountMap.get(n.pieceId) ?? 1)
          : undefined,
    }));

    return NextResponse.json({ notifications: enriched, total });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH /api/notifications - Mark all as read
export async function PATCH() {
  try {
    const user = await requireAuth();
    const userId = user.id;

    await prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error marking notifications read:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
