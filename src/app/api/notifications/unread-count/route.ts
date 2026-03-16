import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/notifications/unread-count - Get unread notification count
export async function GET() {
  try {
    const user = await requireAuth();
    const userId = (user as any).id;

    const count = await prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    });

    return NextResponse.json({ count });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching unread count:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
