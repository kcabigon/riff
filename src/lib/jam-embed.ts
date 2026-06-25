export type JamEmbedType =
  | "spotify_album"
  | "spotify_track"
  | "spotify_playlist"
  | "youtube"
  | "link";

export type JamEmbed = {
  type: JamEmbedType;
  embedUrl: string;
};

export function detectJamEmbed(url: string): JamEmbed | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^(www\.|m\.)/, "");

    if (host === "open.spotify.com") {
      const [, resourceType, resourceId] = u.pathname.split("/");
      const type =
        resourceType === "album"
          ? "spotify_album"
          : resourceType === "track"
            ? "spotify_track"
            : resourceType === "playlist"
              ? "spotify_playlist"
              : null;
      if (type && resourceId)
        return {
          type,
          embedUrl: `https://open.spotify.com/embed/${resourceType}/${resourceId}`,
        };
    }

    if (host === "youtube.com" || host === "youtu.be") {
      let videoId: string | null = null;
      if (host === "youtu.be") {
        videoId = u.pathname.slice(1);
      } else if (u.pathname.startsWith("/shorts/")) {
        videoId = u.pathname.split("/shorts/")[1] ?? null;
      } else {
        videoId = u.searchParams.get("v");
      }
      if (videoId)
        return {
          type: "youtube",
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
        };
    }

    return { type: "link", embedUrl: url.trim() };
  } catch {
    return null;
  }
}

export async function fetchJamThumbnail(
  url: string,
  type: JamEmbedType
): Promise<string | null> {
  try {
    if (type === "youtube") {
      const u = new URL(url);
      const host = u.hostname.replace(/^(www\.|m\.)/, "");
      let videoId: string | null = null;
      if (host === "youtu.be") videoId = u.pathname.slice(1);
      else if (u.pathname.startsWith("/shorts/"))
        videoId = u.pathname.split("/shorts/")[1] ?? null;
      else videoId = u.searchParams.get("v");
      if (videoId) return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
    }

    if (type.startsWith("spotify_")) {
      const res = await fetch(
        `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`,
        {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; RiffBot/1.0)" },
          signal: AbortSignal.timeout(5000),
        }
      );
      if (res.ok) {
        const data = (await res.json()) as { thumbnail_url?: string };
        return data.thumbnail_url ?? null;
      }
    }

    if (type === "link") {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; RiffBot/1.0)" },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const html = await res.text();
        const match =
          /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i.exec(
            html
          ) ??
          /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i.exec(
            html
          );
        return match?.[1] ?? null;
      }
    }
  } catch {
    // non-fatal
  }
  return null;
}
