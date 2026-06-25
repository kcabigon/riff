"use client";

import { useState, useEffect } from "react";
import PrimaryButton from "@/components/PrimaryButton";
import type { OEmbedData } from "@/app/api/oembed/route";
import { detectJamEmbed } from "@/lib/jam-embed";
import type { JamEmbedType } from "@/lib/jam-embed";
import { relativeTime } from "@/lib/timeAgo";
import { useNowPlaying } from "@/contexts/NowPlayingContext";

export type JamData = {
  id: string;
  url: string | null;
  content: string;
  note: string;
  createdAt: Date;
  thumbnailUrl: string | null;
};

const COVER_SIZE = 160;

// ─── Cover placeholder ────────────────────────────────────────────────────────

function CoverPlaceholder({ label }: { label: string }) {
  const initials = label
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div
      style={{
        width: COVER_SIZE,
        height: COVER_SIZE,
        flexShrink: 0,
        backgroundColor: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-dm-serif-text)",
          fontSize: "20px",
          fontWeight: 400,
          color: "#00FF66",
        }}
      >
        {initials}
      </span>
    </div>
  );
}

// ─── New jam form ─────────────────────────────────────────────────────────────

type EmbedInfo = { type: JamEmbedType; embedUrl: string };

function InlineEmbed({ info }: { info: EmbedInfo }) {
  const spotifyHeight =
    info.type === "spotify_track"
      ? "152px"
      : info.type === "spotify_playlist"
        ? "450px"
        : "352px";

  if (info.type === "youtube") {
    return (
      <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
        <iframe
          src={info.embedUrl}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            border: "none",
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <iframe
      src={info.embedUrl}
      width="100%"
      height={spotifyHeight}
      style={{ border: "none", display: "block" }}
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      allowFullScreen
    />
  );
}

function NewJamForm({
  onCreated,
  onThumbnailChange,
}: {
  onCreated: (jam: JamData) => void;
  onThumbnailChange: (url: string | null) => void;
}) {
  const [url, setUrl] = useState("");
  const [heading, setHeading] = useState("");
  const [note, setNote] = useState("");
  const [embedInfo, setEmbedInfo] = useState<EmbedInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wordCount = note.trim() ? note.trim().split(/\s+/).length : 0;
  const overLimit = wordCount > 250;
  const canSubmit =
    heading.trim() && wordCount > 0 && !overLimit && !isSubmitting;

  useEffect(() => {
    const trimmed = url.trim();
    if (!trimmed) {
      setEmbedInfo(null);
      onThumbnailChange(null);
      return;
    }

    const base = detectJamEmbed(trimmed);
    if (!base) {
      setEmbedInfo(null);
      onThumbnailChange(null);
      return;
    }

    let cancelled = false;

    if (base.type === "youtube") {
      setEmbedInfo(base as EmbedInfo);
      const videoId = base.embedUrl.split("/embed/")[1] ?? null;
      onThumbnailChange(
        videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : null
      );
      return;
    }

    // Spotify
    setEmbedInfo(base);
    onThumbnailChange(null);
    fetch(`/api/oembed?url=${encodeURIComponent(trimmed)}`)
      .then((r) => r.json())
      .then((data: OEmbedData) => {
        if (!cancelled) onThumbnailChange(data.thumbnail_url ?? null);
      })
      .catch(() => {
        if (!cancelled) onThumbnailChange(null);
      });
    return () => {
      cancelled = true;
    };
  }, [url, onThumbnailChange]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/jams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim() || undefined,
          content: heading.trim(),
          note: note.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed to post jam");
      const jam = (await res.json()) as JamData;
      onCreated(jam);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto" }}>
      {/* Heading */}
      <input
        type="text"
        value={heading}
        onChange={(e) => setHeading(e.target.value)}
        placeholder="What's your jam?"
        className="jam-editor-input"
        style={{
          display: "block",
          width: "100%",
          boxSizing: "border-box",
          border: "none",
          outline: "none",
          padding: 0,
          background: "transparent",
          fontFamily: "var(--font-dm-serif-text)",
          fontSize: "32px",
          fontWeight: 400,
          color: "#000000",
          lineHeight: 1.2,
          marginBottom: "20px",
        }}
      />

      {/* Note */}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Share what you're currently into..."
        rows={8}
        className="jam-editor-input"
        style={{
          display: "block",
          width: "100%",
          boxSizing: "border-box",
          border: "none",
          outline: "none",
          resize: "none",
          padding: 0,
          background: "transparent",
          fontFamily: "var(--font-dm-sans)",
          fontSize: "16px",
          fontWeight: 300,
          color: "#000000",
          lineHeight: 1.6,
        }}
      />
      <p
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "12px",
          fontWeight: 300,
          color: overLimit ? "#DC2626" : "#808080",
          margin: "4px 0 28px",
          textAlign: "right",
        }}
      >
        {wordCount} / 250 words
      </p>

      {/* Link — editor attachment style */}
      <div
        style={{
          height: "1px",
          backgroundColor: "#E6E6E6",
          margin: "0 0 16px",
        }}
      />
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste a Spotify or YouTube link"
        className="jam-editor-input"
        style={{
          display: "block",
          width: "100%",
          boxSizing: "border-box",
          border: "none",
          outline: "none",
          padding: 0,
          background: "transparent",
          fontFamily: "var(--font-dm-sans)",
          fontSize: "14px",
          fontWeight: 300,
          color: "#000000",
          lineHeight: 1.4,
        }}
      />

      {embedInfo && (
        <div style={{ marginTop: "16px" }}>
          <InlineEmbed info={embedInfo} />
        </div>
      )}

      <div style={{ marginTop: "28px" }}>
        {error && (
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              fontWeight: 300,
              color: "#DC2626",
              margin: "0 0 12px",
            }}
          >
            {error}
          </p>
        )}
        <PrimaryButton onClick={handleSubmit} disabled={!canSubmit}>
          {isSubmitting ? "Posting..." : "Post jam"}
        </PrimaryButton>
      </div>
    </div>
  );
}

// ─── Jam content panel ────────────────────────────────────────────────────────

function JamContent({ jam }: { jam: JamData }) {
  const { nowPlaying, play } = useNowPlaying();
  const embed = jam.url ? detectJamEmbed(jam.url) : null;
  const isPlaying = !!embed && nowPlaying?.embedUrl === embed.embedUrl;

  const handlePlay = () => {
    if (!embed) return;
    play({
      embedUrl: embed.embedUrl,
      embedType: embed.type,
      title: jam.content,
      thumbnailUrl: jam.thumbnailUrl,
    });
  };

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto" }}>
      <h2
        style={{
          fontFamily: "var(--font-dm-serif-text)",
          fontSize: "32px",
          fontWeight: 400,
          color: "#000000",
          margin: "0 0 6px",
          lineHeight: 1.2,
        }}
      >
        {jam.content}
      </h2>
      <p
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "12px",
          fontWeight: 300,
          color: "#808080",
          margin: "0 0 20px",
        }}
      >
        {relativeTime(
          jam.createdAt instanceof Date
            ? jam.createdAt.toISOString()
            : jam.createdAt
        )}
      </p>
      <p
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "16px",
          fontWeight: 300,
          color: "#000000",
          margin: "0 0 28px",
          lineHeight: 1.6,
        }}
      >
        {jam.note}
      </p>

      {embed && (
        <button
          onClick={isPlaying ? undefined : handlePlay}
          style={{
            display: "block",
            width: "100%",
            padding: 0,
            border: "none",
            background: "none",
            cursor: isPlaying ? "default" : "pointer",
            position: "relative",
          }}
        >
          {/* Thumbnail */}
          {jam.thumbnailUrl ? (
            <img
              src={jam.thumbnailUrl}
              alt={jam.content}
              style={{
                width: "100%",
                display: "block",
                objectFit: "cover",
                maxHeight: "360px",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                aspectRatio: "16/9",
                backgroundColor: "#000000",
              }}
            />
          )}

          {/* Overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: isPlaying
                ? "rgba(0,0,0,0.5)"
                : "rgba(0,0,0,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background-color 150ms ease",
            }}
          >
            {isPlaying ? (
              <span
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#00FF66",
                  letterSpacing: "0.05em",
                }}
              >
                ▶ NOW PLAYING
              </span>
            ) : (
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  backgroundColor: "#00FF66",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: "20px", marginLeft: "3px" }}>▶</span>
              </div>
            )}
          </div>
        </button>
      )}
    </div>
  );
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export default function JamsTab({
  jams: initialJams,
  isOwnProfile,
}: {
  jams: JamData[];
  isOwnProfile?: boolean;
}) {
  const [jams, setJams] = useState<JamData[]>(initialJams);
  const [selectedId, setSelectedId] = useState<string>(
    initialJams.length > 0 ? initialJams[0].id : isOwnProfile ? "new" : ""
  );
  const [draftThumbnailUrl, setDraftThumbnailUrl] = useState<string | null>(
    null
  );

  const isNew = selectedId === "new";
  const selected = isNew
    ? null
    : (jams.find((j) => j.id === selectedId) ?? null);

  const handleCreated = (jam: JamData) => {
    setDraftThumbnailUrl(null);
    setJams((prev) => [jam, ...prev]);
    setSelectedId(jam.id);
  };

  return (
    <div>
      {/* Cover strip */}
      <div
        style={{
          borderBottom: "1px solid #E6E6E6",
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        <div style={{ padding: "16px 24px", display: "flex", gap: "8px" }}>
          {/* + New jam square */}
          {isOwnProfile && (
            <button
              onClick={() => setSelectedId("new")}
              title="Add a jam"
              style={{
                padding: 0,
                background: "none",
                border: "none",
                cursor: "pointer",
                flexShrink: 0,
                boxShadow: isNew ? "4px 4px 0px 0px #00FF66" : "none",
                transition: "box-shadow 150ms ease",
              }}
            >
              {draftThumbnailUrl && isNew ? (
                <img
                  src={draftThumbnailUrl}
                  alt="Draft"
                  style={{
                    width: COVER_SIZE,
                    height: COVER_SIZE,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: COVER_SIZE,
                    height: COVER_SIZE,
                    backgroundColor: "#E6E6E6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px dashed #CCCCCC",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "32px",
                      fontWeight: 300,
                      color: "#CCCCCC",
                      lineHeight: 1,
                    }}
                  >
                    +
                  </span>
                </div>
              )}
            </button>
          )}

          {jams.map((jam) => {
            const isSelected = jam.id === selectedId;
            return (
              <button
                key={jam.id}
                onClick={() => setSelectedId(jam.id)}
                title={jam.content}
                style={{
                  padding: 0,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  flexShrink: 0,
                  boxShadow: isSelected ? "4px 4px 0px 0px #00FF66" : "none",
                  transition: "box-shadow 150ms ease",
                }}
              >
                {jam.thumbnailUrl ? (
                  <img
                    src={jam.thumbnailUrl}
                    alt={jam.content}
                    style={{
                      width: COVER_SIZE,
                      height: COVER_SIZE,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <CoverPlaceholder label={jam.content} />
                )}
              </button>
            );
          })}

          {/* Empty state for non-owners */}
          {!isOwnProfile && jams.length === 0 && (
            <div style={{ padding: "48px 0" }}>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "16px",
                  fontWeight: 300,
                  color: "#808080",
                  margin: 0,
                }}
              >
                No jams yet.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Content panel */}
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "32px 24px 64px",
        }}
      >
        {isNew ? (
          <NewJamForm
            onCreated={handleCreated}
            onThumbnailChange={setDraftThumbnailUrl}
          />
        ) : selected ? (
          <JamContent jam={selected} />
        ) : null}
      </div>
    </div>
  );
}
