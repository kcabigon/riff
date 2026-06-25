import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { detectJamEmbed, fetchJamThumbnail } from "@/lib/jam-embed";

// PATCH /api/jams/[id]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
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

    const jam = await prisma.jam.findUnique({ where: { id } });
    if (!jam) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (jam.userId !== user.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const trimmedUrl = url?.trim() || null;

    const updated = await prisma.jam.update({
      where: { id },
      data: { content: content.trim(), note: note.trim(), url: trimmedUrl },
      select: {
        id: true,
        url: true,
        content: true,
        note: true,
        createdAt: true,
      },
    });

    let thumbnailUrl: string | null = null;
    if (trimmedUrl) {
      const embed = detectJamEmbed(trimmedUrl);
      if (embed) thumbnailUrl = await fetchJamThumbnail(trimmedUrl, embed.type);
    }

    return NextResponse.json({ ...updated, thumbnailUrl });
  } catch {
    return NextResponse.json(
      { error: "Failed to update jam" },
      { status: 500 }
    );
  }
}

// DELETE /api/jams/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const jam = await prisma.jam.findUnique({ where: { id } });
    if (!jam) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (jam.userId !== user.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.jam.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete jam" },
      { status: 500 }
    );
  }
}
