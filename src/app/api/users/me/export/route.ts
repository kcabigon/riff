import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/users/me/export - Export all user writing as JSON
export async function GET() {
  try {
    const user = await requireAuth();
    const userId = (user as any).id;

    const pieces = await prisma.piece.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        title: true,
        currentContent: true,
        wordCount: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      pieceCount: pieces.length,
      pieces: pieces.map((p) => ({
        title: p.title,
        content: p.currentContent,
        wordCount: p.wordCount,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error exporting data:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
