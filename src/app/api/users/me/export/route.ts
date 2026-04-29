import { NextResponse } from "next/server";
import JSZip from "jszip";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { pieceToDocxBuffer, slugifyTitle } from "@/lib/tiptap-to-docx";

// GET /api/users/me/export - Export all user writing as .docx
export async function GET() {
  try {
    const user = await requireAuth();

    const pieces = await prisma.piece.findMany({
      where: { authorId: user.id },
      select: {
        title: true,
        subtitle: true,
        currentContent: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (pieces.length === 0) {
      return NextResponse.json(
        { error: "No pieces to export" },
        { status: 404 }
      );
    }

    // Single piece — return as .docx directly
    if (pieces.length === 1) {
      const piece = pieces[0];
      const buffer = await pieceToDocxBuffer(piece);
      const filename = slugifyTitle(piece.title, 0);

      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // Multiple pieces — zip them
    const zip = new JSZip();

    const buffers = await Promise.all(
      pieces.map((piece, i) =>
        pieceToDocxBuffer(piece).then((buf) => ({ buf, piece, i }))
      )
    );

    // Track slugs to handle duplicate titles
    const slugCounts: Record<string, number> = {};

    for (const { buf, piece, i } of buffers) {
      let slug = slugifyTitle(piece.title, i);
      if (slugCounts[slug] !== undefined) {
        slugCounts[slug]++;
        slug = slug.replace(".docx", `-${slugCounts[slug]}.docx`);
      } else {
        slugCounts[slug] = 0;
      }

      zip.file(slug, buf);
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    return new Response(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="riff-export.zip"`,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error exporting data:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
