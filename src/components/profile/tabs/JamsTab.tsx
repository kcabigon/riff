"use client";

import { useState, useEffect } from "react";
import PrimaryButton from "@/components/PrimaryButton";
import { detectJamEmbed } from "@/lib/jam-embed";
import type { JamEmbedType } from "@/lib/jam-embed";
import { relativeTime } from "@/lib/timeAgo";

export type JamData = {
  id: string;
  url: string | null;
  content: string;
  note: string;
  createdAt: Date;
  thumbnailUrl: string | null;
};

const COVER_SIZE = 200;

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

// ─── 3-dot cover actions ──────────────────────────────────────────────────────

function CoverActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const close = () => {
    setOpen(false);
    setConfirming(false);
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
          setConfirming(false);
        }}
        title="More options"
        style={{
          position: "absolute",
          top: 6,
          right: 6,
          zIndex: 3,
          width: 28,
          height: 28,
          padding: 0,
          backgroundColor: "rgba(0,0,0,0.6)",
          border: "none",
          cursor: "pointer",
          color: "#FFFFFF",
          fontFamily: "var(--font-dm-sans)",
          fontSize: "9px",
          fontWeight: 700,
          letterSpacing: "2px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        •••
      </button>

      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 10 }}
            onClick={close}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.85)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              zIndex: 11,
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                close();
                onEdit();
              }}
              style={{
                backgroundColor: "transparent",
                border: "1px solid rgba(255,255,255,0.4)",
                color: "#FFFFFF",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "12px",
                fontWeight: 500,
                padding: "5px 0",
                cursor: "pointer",
                width: 100,
              }}
            >
              Edit
            </button>

            {confirming ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  close();
                  onDelete();
                }}
                style={{
                  backgroundColor: "#DC2626",
                  border: "none",
                  color: "#FFFFFF",
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "12px",
                  fontWeight: 500,
                  padding: "5px 0",
                  cursor: "pointer",
                  width: 100,
                }}
              >
                Confirm
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirming(true);
                }}
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid rgba(220,38,38,0.4)",
                  color: "#DC2626",
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "12px",
                  fontWeight: 500,
                  padding: "5px 0",
                  cursor: "pointer",
                  width: 100,
                }}
              >
                Delete
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
}

// ─── Shared embed preview ─────────────────────────────────────────────────────

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

// ─── New jam form ─────────────────────────────────────────────────────────────

function NewJamForm({
  initialUrl,
  onCreated,
}: {
  initialUrl?: string;
  onCreated: (jam: JamData) => void;
}) {
  const [url, setUrl] = useState(initialUrl ?? "");
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
      return;
    }
    const base = detectJamEmbed(trimmed);
    setEmbedInfo(base ? { type: base.type, embedUrl: base.embedUrl } : null);
  }, [url]);

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

// ─── Edit jam form ────────────────────────────────────────────────────────────

function EditJamForm({
  jam,
  onUpdated,
  onCancel,
}: {
  jam: JamData;
  onUpdated: (jam: JamData) => void;
  onCancel: () => void;
}) {
  const [url, setUrl] = useState(jam.url ?? "");
  const [heading, setHeading] = useState(jam.content);
  const [note, setNote] = useState(jam.note);
  const [embedInfo, setEmbedInfo] = useState<EmbedInfo | null>(() => {
    if (!jam.url) return null;
    const base = detectJamEmbed(jam.url);
    return base ? { type: base.type, embedUrl: base.embedUrl } : null;
  });
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
      return;
    }
    const base = detectJamEmbed(trimmed);
    setEmbedInfo(base ? { type: base.type, embedUrl: base.embedUrl } : null);
  }, [url]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/jams/${jam.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim() || undefined,
          content: heading.trim(),
          note: note.trim(),
        }),
      });
      if (!res.ok) throw new Error();
      const updated = (await res.json()) as JamData;
      onUpdated(updated);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto" }}>
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

      <div
        style={{
          marginTop: "28px",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <PrimaryButton onClick={handleSubmit} disabled={!canSubmit}>
          {isSubmitting ? "Saving..." : "Save"}
        </PrimaryButton>
        <button
          onClick={onCancel}
          style={{
            backgroundColor: "transparent",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            fontWeight: 300,
            color: "#808080",
            padding: 0,
          }}
        >
          Cancel
        </button>
        {error && (
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              fontWeight: 300,
              color: "#DC2626",
              margin: 0,
            }}
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Jam content panel ────────────────────────────────────────────────────────

function JamContent({ jam }: { jam: JamData }) {
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [mountedIds, setMountedIds] = useState<Set<string>>(
    () => new Set(initialJams.length > 0 ? [initialJams[0].id] : [])
  );

  useEffect(() => {
    if (linkUrl.trim() && detectJamEmbed(linkUrl.trim())) {
      setSelectedId("new");
      setEditingId(null);
    }
  }, [linkUrl]);

  useEffect(() => {
    if (selectedId && selectedId !== "new") {
      setMountedIds((prev) => {
        if (prev.has(selectedId)) return prev;
        return new Set([...prev, selectedId]);
      });
    }
  }, [selectedId]);

  const isNew = selectedId === "new";
  const selected = isNew
    ? null
    : (jams.find((j) => j.id === selectedId) ?? null);

  const handleCreated = (jam: JamData) => {
    setLinkUrl("");
    setJams((prev) => [jam, ...prev]);
    setSelectedId(jam.id);
  };

  const handleUpdated = (updated: JamData) => {
    setEditingId(null);
    setJams((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/jams/${id}`, { method: "DELETE" });
      if (!res.ok) return;
      const remaining = jams.filter((j) => j.id !== id);
      setJams(remaining);
      if (selectedId === id) {
        setSelectedId(
          remaining.length > 0 ? remaining[0].id : isOwnProfile ? "new" : ""
        );
      }
      if (editingId === id) setEditingId(null);
    } catch {
      // silently fail
    }
  };

  return (
    <div>
      {/* Persistent link input — own profile only */}
      {isOwnProfile && (
        <div
          style={{
            maxWidth: "720px",
            margin: "0 auto",
            padding: "20px 24px",
            borderBottom: "1px solid #E6E6E6",
          }}
        >
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Paste a Spotify or YouTube link to start a new jam..."
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
              fontSize: "16px",
              fontWeight: 300,
              color: "#000000",
              lineHeight: 1.4,
            }}
          />
        </div>
      )}

      {/* Cover strip — cascading carousel */}
      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "0 24px",
          borderBottom: "1px solid #E6E6E6",
        }}
      >
        <div style={{ overflowX: "auto", scrollbarWidth: "none" }}>
          <div style={{ padding: "16px 0", display: "flex", gap: "8px" }}>
            {jams.map((jam) => {
              const isSelected = jam.id === selectedId;
              return (
                <div
                  key={jam.id}
                  style={{
                    position: "relative",
                    flexShrink: 0,
                    boxShadow: isSelected ? "4px 4px 0px 0px #00FF66" : "none",
                    transition: "box-shadow 150ms ease",
                  }}
                >
                  <button
                    onClick={() => {
                      setSelectedId(jam.id);
                      setEditingId(null);
                    }}
                    title={jam.content}
                    style={{
                      padding: 0,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      display: "block",
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
                  {isOwnProfile && (
                    <CoverActions
                      onEdit={() => {
                        setSelectedId(jam.id);
                        setEditingId(jam.id);
                      }}
                      onDelete={() => handleDelete(jam.id)}
                    />
                  )}
                </div>
              );
            })}
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
      </div>

      {/* Content panel */}
      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "32px 24px 48px",
        }}
      >
        {isNew ? (
          <NewJamForm
            initialUrl={linkUrl || undefined}
            onCreated={handleCreated}
          />
        ) : selected && editingId === selected.id ? (
          <EditJamForm
            jam={selected}
            onUpdated={handleUpdated}
            onCancel={() => setEditingId(null)}
          />
        ) : selected ? (
          <>
            <JamContent jam={selected} />
            {/* Persistent iframes — lazily mounted, never removed so audio survives jam switches */}
            {jams.map((jam) => {
              if (!mountedIds.has(jam.id)) return null;
              const embed = jam.url ? detectJamEmbed(jam.url) : null;
              if (!embed) return null;
              return (
                <div
                  key={jam.id}
                  style={{ display: jam.id === selectedId ? "block" : "none" }}
                >
                  <InlineEmbed
                    info={{ type: embed.type, embedUrl: embed.embedUrl }}
                  />
                </div>
              );
            })}
          </>
        ) : null}
      </div>
    </div>
  );
}
