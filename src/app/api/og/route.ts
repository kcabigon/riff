import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";

export type OGData = {
  title: string | null;
  description: string | null;
  image: string | null;
  domain: string;
};

function extractMeta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`,
      "i"
    ),
  ];
  for (const re of patterns) {
    const match = re.exec(html);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

// GET /api/og?url=https://...
export async function GET(req: Request) {
  try {
    await requireAuth();

    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
    if (!url)
      return NextResponse.json({ error: "Missing url" }, { status: 400 });

    const parsed = new URL(url);
    const domain = parsed.hostname.replace(/^www\./, "");

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; RiffBot/1.0)" },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return NextResponse.json({
        title: null,
        description: null,
        image: null,
        domain,
      } satisfies OGData);
    }

    const html = await res.text();

    const image =
      extractMeta(html, "og:image") ?? extractMeta(html, "twitter:image");
    const title =
      extractMeta(html, "og:title") ??
      extractMeta(html, "twitter:title") ??
      /<title[^>]*>([^<]+)<\/title>/i.exec(html)?.[1]?.trim() ??
      null;
    const description =
      extractMeta(html, "og:description") ??
      extractMeta(html, "twitter:description");

    return NextResponse.json({
      title,
      description,
      image,
      domain,
    } satisfies OGData);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch OG data" },
      { status: 500 }
    );
  }
}
