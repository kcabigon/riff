import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/riffs/[id]/eligible-drafts - Returns current user's pieces not already linked to this riff
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const userId = (user as any).id;
    const { id: riffId } = await params;

    const pieces = await prisma.piece.findMany({
      where: {
        authorId: userId,
        riffs: {
          none: { riffId },
        },
      },
      select: {
        id: true,
        title: true,
        wordCount: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ pieces });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
