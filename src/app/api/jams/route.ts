import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
// POST /api/jams
export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const { url, content, note } = (await req.json()) as {
      url?: string;
      content: string;
      note: string;
    };

    if (!content?.trim() || !note?.trim()) {
      return NextResponse.json(
        { error: "content and note are required" },
        { status: 400 }
      );
    }

    const jam = await prisma.jam.create({
      data: {
        userId: user.id,
        content: content.trim(),
        note: note.trim(),
        url: url?.trim() || null,
      },
      select: {
        id: true,
        url: true,
        content: true,
        note: true,
        createdAt: true,
      },
    });

    return NextResponse.json(jam, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create jam" },
      { status: 500 }
    );
  }
}
