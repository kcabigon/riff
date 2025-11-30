import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const { title, content, excerpt } = await req.json();

    // Validate input
    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Piece title is required" },
        { status: 400 }
      );
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Piece content is required" },
        { status: 400 }
      );
    }

    // Create piece
    const piece = await prisma.piece.create({
      data: {
        title: title.trim(),
        currentContent: content,
        currentExcerpt: excerpt?.trim() || null,
        authorId: (user as any).id,
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
        piece,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("Error creating piece:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the piece" },
      { status: 500 }
    );
  }
}
