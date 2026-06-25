"use client";

import { useState, useEffect, useRef } from "react";
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
};

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
  onCancel,
}: {
  initialUrl?: string;
  onCreated: (jam: JamData) => void;
  onCancel: () => void;
}) {
  const url = initialUrl ?? "";
  const [heading, setHeading] = useState("");
  const [note, setNote] = useState("");
  const [embedInfo, setEmbedInfo] = useState<EmbedInfo | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = note.trim() ? note.trim().split(/\s+/).length : 0;
  const overLimit = wordCount > 250;
  const canSubmit =
    heading.trim() && wordCount > 0 && !overLimit && !isSubmitting;

  useEffect(() => {
    const el = noteRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [note]);

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
    <div>
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
        ref={noteRef}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Share why..."
        className="jam-editor-input"
        style={{
          display: "block",
          width: "100%",
          boxSizing: "border-box",
          border: "none",
          outline: "none",
          resize: "none",
          overflow: "hidden",
          padding: 0,
          background: "transparent",
          fontFamily: "var(--font-dm-sans)",
          fontSize: "16px",
          fontWeight: 300,
          color: "#000000",
          lineHeight: 1.6,
          minHeight: "128px",
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

      {embedInfo && (
        <div style={{ marginBottom: "28px" }}>
          <InlineEmbed info={embedInfo} />
        </div>
      )}

      <div>
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
        <button
          onClick={onCancel}
          style={{
            display: "block",
            width: "100%",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            fontWeight: 300,
            color: "#808080",
            padding: "20px 0 0",
            textAlign: "center",
          }}
        >
          Cancel
        </button>
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
  const url = jam.url ?? "";
  const [heading, setHeading] = useState(jam.content);
  const [note, setNote] = useState(jam.note);
  const [embedInfo] = useState<EmbedInfo | null>(() => {
    if (!jam.url) return null;
    const base = detectJamEmbed(jam.url);
    return base ? { type: base.type, embedUrl: base.embedUrl } : null;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = note.trim() ? note.trim().split(/\s+/).length : 0;
  const overLimit = wordCount > 250;
  const canSubmit =
    heading.trim() && wordCount > 0 && !overLimit && !isSubmitting;

  useEffect(() => {
    const el = noteRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [note]);

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
    <div>
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
        ref={noteRef}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Share why..."
        className="jam-editor-input"
        style={{
          display: "block",
          width: "100%",
          boxSizing: "border-box",
          border: "none",
          outline: "none",
          resize: "none",
          overflow: "hidden",
          padding: 0,
          background: "transparent",
          fontFamily: "var(--font-dm-sans)",
          fontSize: "16px",
          fontWeight: 300,
          color: "#000000",
          lineHeight: 1.6,
          minHeight: "128px",
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

      {embedInfo && (
        <div style={{ marginBottom: "28px" }}>
          <InlineEmbed info={embedInfo} />
        </div>
      )}

      <div>
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
          {isSubmitting ? "Saving..." : "Save"}
        </PrimaryButton>
        <button
          onClick={onCancel}
          style={{
            display: "block",
            width: "100%",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            fontWeight: 300,
            color: "#808080",
            padding: "20px 0 0",
            textAlign: "center",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Jam card ─────────────────────────────────────────────────────────────────

function JamCard({
  jam,
  isOwnProfile,
  onUpdated,
  onDeleted,
}: {
  jam: JamData;
  isOwnProfile?: boolean;
  onUpdated: (jam: JamData) => void;
  onDeleted: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const embed = jam.url ? detectJamEmbed(jam.url) : null;

  const handleShare = async () => {
    const noteSpaced = jam.note.split(/\n+/).join("\n\n");
    const plainText = [
      jam.content,
      "",
      noteSpaced,
      ...(jam.url ? ["", jam.url] : []),
    ].join("\n");

    const htmlBody = jam.note
      .split(/\n+/)
      .map((p) => `<p style="margin:0 0 1em">${p}</p>`)
      .join("");
    const htmlText = `<strong>${jam.content}</strong><br><br>${htmlBody}${jam.url ? `<br><a href="${jam.url}">${jam.url}</a>` : ""}`;

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/plain": new Blob([plainText], { type: "text/plain" }),
          "text/html": new Blob([htmlText], { type: "text/html" }),
        }),
      ]);
    } catch {
      await navigator.clipboard.writeText(plainText);
    }

    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, 2500);
  };

  if (editing) {
    return (
      <div style={{ padding: "40px 0", borderBottom: "1px solid #E6E6E6" }}>
        <EditJamForm
          jam={jam}
          onUpdated={(updated) => {
            setEditing(false);
            onUpdated(updated);
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: "40px 0", borderBottom: "1px solid #E6E6E6" }}>
      {/* Title row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          marginBottom: "6px",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-dm-serif-text)",
            fontSize: "32px",
            fontWeight: 400,
            color: "#000000",
            margin: 0,
            lineHeight: 1.2,
            flex: 1,
          }}
        >
          {jam.content}
        </h2>

        {isOwnProfile && (
          <div style={{ position: "relative", flexShrink: 0, marginTop: 4 }}>
            <button
              onClick={() => {
                setConfirmDelete(false);
                setOpen((o) => !o);
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "2px",
                color: "#808080",
                padding: "4px",
                lineHeight: 1,
              }}
            >
              •••
            </button>
            {open && (
              <>
                <div
                  style={{ position: "fixed", inset: 0, zIndex: 10 }}
                  onClick={() => {
                    setOpen(false);
                    setCopied(false);
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    zIndex: 11,
                    backgroundColor: "#FFFFFF",
                    border: "2px solid #000000",
                    boxShadow: "4px 4px 0px 0px #000000",
                    minWidth: 160,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {copied ? (
                    <div style={{ padding: "10px 14px" }}>
                      <p
                        style={{
                          fontFamily: "var(--font-dm-sans)",
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "#000000",
                          margin: "0 0 2px",
                        }}
                      >
                        Copied to clipboard.
                      </p>
                      <p
                        style={{
                          fontFamily: "var(--font-dm-sans)",
                          fontSize: "13px",
                          fontWeight: 300,
                          color: "#808080",
                          margin: 0,
                        }}
                      >
                        Text to friends.
                      </p>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={handleShare}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "10px 14px",
                          textAlign: "left",
                          fontFamily: "var(--font-dm-sans)",
                          fontSize: "13px",
                          fontWeight: 400,
                          color: "#000000",
                        }}
                      >
                        Share
                      </button>
                      <button
                        onClick={() => {
                          setOpen(false);
                          setEditing(true);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          borderBottom: "1px solid #E6E6E6",
                          cursor: "pointer",
                          padding: "10px 14px",
                          textAlign: "left",
                          fontFamily: "var(--font-dm-sans)",
                          fontSize: "13px",
                          fontWeight: 400,
                          color: "#000000",
                        }}
                      >
                        Edit
                      </button>
                      {confirmDelete ? (
                        <button
                          onClick={() => {
                            setOpen(false);
                            onDeleted();
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "10px 14px",
                            textAlign: "left",
                            fontFamily: "var(--font-dm-sans)",
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "#DC2626",
                          }}
                        >
                          Confirm delete
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(true)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "10px 14px",
                            textAlign: "left",
                            fontFamily: "var(--font-dm-sans)",
                            fontSize: "13px",
                            fontWeight: 400,
                            color: "#DC2626",
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

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
          whiteSpace: "pre-wrap",
        }}
      >
        {jam.note}
      </p>

      {embed && (
        <InlineEmbed info={{ type: embed.type, embedUrl: embed.embedUrl }} />
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
  const [linkUrl, setLinkUrl] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (linkUrl.trim() && detectJamEmbed(linkUrl.trim())) {
      setShowForm(true);
    }
  }, [linkUrl]);

  const handleCreated = (jam: JamData) => {
    setLinkUrl("");
    setShowForm(false);
    setJams((prev) => [jam, ...prev]);
  };

  const handleUpdated = (updated: JamData) => {
    setJams((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
  };

  const handleDeleted = async (id: string) => {
    try {
      const res = await fetch(`/api/jams/${id}`, { method: "DELETE" });
      if (!res.ok) return;
      setJams((prev) => prev.filter((j) => j.id !== id));
    } catch {
      // silently fail
    }
  };

  return (
    <div
      style={{ maxWidth: "720px", margin: "0 auto", padding: "0 24px 64px" }}
    >
      {/* New jam — own profile only */}
      {isOwnProfile && (
        <div style={{ padding: showForm ? "40px 0" : "20px 0 0" }}>
          {showForm ? (
            <NewJamForm
              initialUrl={linkUrl}
              onCreated={handleCreated}
              onCancel={() => {
                setShowForm(false);
                setLinkUrl("");
              }}
            />
          ) : (
            <div
              style={{
                backgroundColor: "#F5F5F5",
                padding: "10px 14px",
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
                  lineHeight: 1.6,
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Feed */}
      {jams.length === 0 ? (
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#808080",
            margin: "48px 0 0",
          }}
        >
          No jams yet.
        </p>
      ) : (
        jams.map((jam) => (
          <JamCard
            key={jam.id}
            jam={jam}
            isOwnProfile={isOwnProfile}
            onUpdated={handleUpdated}
            onDeleted={() => handleDeleted(jam.id)}
          />
        ))
      )}
    </div>
  );
}
