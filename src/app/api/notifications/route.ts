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
        where: { recipientId: userId },
        include: {
          actor: {
            select: { id: true, name: true, username: true, avatarUrl: true },
          },
          club: { select: { id: true, name: true } },
          riff: { select: { id: true, title: true, clubId: true } },
          piece: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where: { recipientId: userId } }),
    ]);

    return NextResponse.json({ notifications, total });
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
