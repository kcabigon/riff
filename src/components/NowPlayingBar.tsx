"use client";

import { useNowPlaying } from "@/contexts/NowPlayingContext";

const BAR_HEIGHT = 152;

export default function NowPlayingBar() {
  const { nowPlaying, stop } = useNowPlaying();

  if (!nowPlaying) return null;

  const { embedUrl, embedType } = nowPlaying;

  const iframeHeight =
    embedType === "spotify_track"
      ? 152
      : embedType === "spotify_playlist"
        ? 450
        : embedType === "spotify_album"
          ? 352
          : 152; // youtube

  const embedSrc = `${embedUrl}${embedUrl.includes("?") ? "&" : "?"}autoplay=1`;

  const allow =
    embedType === "youtube"
      ? "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      : "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: BAR_HEIGHT,
        backgroundColor: "#000000",
        borderTop: "2px solid #000000",
        zIndex: 100,
        overflow: "hidden",
      }}
    >
      {/* Iframe — clipped by parent overflow:hidden */}
      <div style={{ height: iframeHeight, overflow: "hidden" }}>
        <iframe
          src={embedSrc}
          style={{
            width: "100%",
            height: iframeHeight,
            border: "none",
            display: "block",
          }}
          allow={allow}
          allowFullScreen
        />
      </div>

      {/* Stop button */}
      <button
        onClick={stop}
        title="Stop"
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          zIndex: 101,
          backgroundColor: "rgba(0,0,0,0.6)",
          border: "none",
          cursor: "pointer",
          color: "#FFFFFF",
          fontFamily: "var(--font-dm-sans)",
          fontSize: "12px",
          fontWeight: 300,
          padding: "4px 8px",
          lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  );
}
