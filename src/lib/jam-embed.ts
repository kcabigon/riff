export type JamEmbedType =
  | "spotify_album"
  | "spotify_track"
  | "spotify_playlist"
  | "youtube";

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

    return null;
  } catch {
    return null;
  }
}
