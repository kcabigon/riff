import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { detectJamEmbed, fetchJamThumbnail } from "@/lib/jam-embed";

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

    const trimmedUrl = url?.trim() || null;

    const jam = await prisma.jam.create({
      data: {
        userId: user.id,
        content: content.trim(),
        note: note.trim(),
        url: trimmedUrl,
      },
      select: {
        id: true,
        url: true,
        content: true,
        note: true,
        createdAt: true,
      },
    });

    // Fetch thumbnail for the response (thumbnailUrl not yet in schema — ask Kyle to add it)
    let thumbnailUrl: string | null = null;
    if (trimmedUrl) {
      const embed = detectJamEmbed(trimmedUrl);
      if (embed) thumbnailUrl = await fetchJamThumbnail(trimmedUrl, embed.type);
    }

    return NextResponse.json({ ...jam, thumbnailUrl }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create jam" },
      { status: 500 }
    );
  }
}
