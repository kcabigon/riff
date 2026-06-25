import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";

export type OEmbedData = {
  thumbnail_url: string | null;
  title: string | null;
  author_name: string | null;
};

// GET /api/oembed?url=https://open.spotify.com/...
export async function GET(req: Request) {
  try {
    await requireAuth();

    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
    if (!url)
      return NextResponse.json({ error: "Missing url" }, { status: 400 });

    const res = await fetch(
      `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`,
      {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; RiffBot/1.0)" },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!res.ok) {
      return NextResponse.json({
        thumbnail_url: null,
        title: null,
        author_name: null,
      } satisfies OEmbedData);
    }

    const data = (await res.json()) as {
      thumbnail_url?: string;
      title?: string;
      author_name?: string;
    };

    return NextResponse.json({
      thumbnail_url: data.thumbnail_url ?? null,
      title: data.title ?? null,
      author_name: data.author_name ?? null,
    } satisfies OEmbedData);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch oEmbed data" },
      { status: 500 }
    );
  }
}
