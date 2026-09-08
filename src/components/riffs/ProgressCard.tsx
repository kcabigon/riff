"use client";

import Avatar from "@/components/shared/Avatar";
import NoiseBackground from "@/components/NoiseBackground";
import DraftCard from "@/components/write/DraftCard";
import { relativeTime } from "@/lib/timeAgo";

interface ProgressCardProps {
  user: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
  piece?: {
    id: string;
    title: string;
    wordCount: number;
    updatedAt: string;
    submittedAt: string | null;
    coverImage?: string | null;
    activityLabel?: string;
    // Only populated for the viewer's own piece (see club page's serializer) —
    // required to render the "draft" variant's real DraftCard for the owner.
    preview?: string;
    createdAt?: string;
  } | null;
  // True once the riff this piece belongs to has been revealed — drops the
  // lock icon, since "submitted" no longer means "hidden until reveal."
  revealed?: boolean;
  // False hides the submitted/last-active date line — used where the date
  // isn't meaningful (e.g. the club page's past-riffs grouped view).
  showDate?: boolean;
  // Present only for the viewer's own in-progress piece — makes the whole
  // card clickable (to jump back into writing) instead of purely informational.
  onClick?: () => void;
  // "draft" swaps the in-progress state's noise/dark-overlay treatment for a
  // DraftCard-style card — the real thing for the viewer's own piece (passed
  // via onClick), a blurred lookalike for everyone else's. Defaults to
  // "noise" so existing callers (e.g. the individual riff page) are unaffected.
  variant?: "noise" | "draft";
}

// Fixed filler text for other participants' in-progress cards — never the
// real content. Blurring real content with CSS is trivially bypassed
// (devtools, view-source, disabling styles), which would defeat the whole
// point of hiding work in progress from other participants.
const BLURRED_PREVIEW_FILLER =
  "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";

/* eslint-disable riff/no-non-palette-colors -- intentional pastel rotation */
const PLACEHOLDER_COLORS = [
  "#E8E0D5",
  "#D5E0E8",
  "#E0E8D5",
  "#E8D5E0",
  "#D5E8E0",
  "#E0D5E8",
];
/* eslint-enable riff/no-non-palette-colors */

export default function ProgressCard({
  user,
  piece,
  revealed = false,
  showDate = true,
  onClick,
  variant = "noise",
}: ProgressCardProps) {
  const cardBase: React.CSSProperties = {
    position: "relative",
    border: "1px solid #000000",
    overflow: "hidden",
    aspectRatio: "4 / 5",
  };

  // ── Not started ──────────────────────────────────────────────────────────
  if (!piece) {
    return (
      <div style={cardBase}>
        <NoiseBackground fillMode="cover" />

        {/* "Not started" status — same position as last active line */}
        <div
          style={{
            position: "absolute",
            bottom: "56px",
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "15px",
              fontWeight: 300,
              color: "#808080",
              margin: 0,
            }}
          >
            Not started
          </p>
        </div>

        {/* Avatar — bottom */}
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          <Avatar
            user={{
              id: user.id,
              name: user.name,
              username: null,
              avatarUrl: user.avatarUrl,
            }}
            size={32}
            borderColor="#FFFFFF"
          />
        </div>
      </div>
    );
  }

  // ── Submitted (locked) ───────────────────────────────────────────────────
  if (piece.submittedAt !== null) {
    const placeholderColor =
      PLACEHOLDER_COLORS[piece.id.charCodeAt(0) % PLACEHOLDER_COLORS.length];

    return (
      <div
        style={{
          ...cardBase,
          backgroundColor: piece.coverImage ? undefined : placeholderColor,
          cursor: "default",
        }}
      >
        {/* Cover image */}
        {piece.coverImage && (
          <img
            src={piece.coverImage}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}

        {/* Dark overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
        />

        {/* Lock icon — top center (only while hidden pending reveal) */}
        {!revealed && (
          <div
            style={{
              position: "absolute",
              top: "12px",
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              zIndex: 3,
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="white"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
            </svg>
          </div>
        )}

        {/* Title — vertically centered */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: "24px",
            paddingRight: "24px",
            paddingBottom: "24px",
            paddingLeft: "24px",
            zIndex: 1,
          }}
        >
          <h4
            style={{
              fontFamily: "var(--font-dm-serif-text)",
              fontSize: "20px",
              fontWeight: 400,
              color: "#FFFFFF",
              margin: 0,
              textAlign: "center",
              lineHeight: 1.3,
            }}
          >
            {piece.title}
          </h4>
        </div>

        {/* Submitted label — fixed position above avatar */}
        {showDate && (
          <div
            style={{
              position: "absolute",
              bottom: "56px",
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              zIndex: 2,
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "rgba(255, 255, 255, 0.7)",
                margin: 0,
              }}
            >
              {relativeTime(piece.submittedAt)}
            </p>
          </div>
        )}

        {/* Author avatar — bottom center */}
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            zIndex: 2,
          }}
        >
          <Avatar
            user={{
              id: user.id,
              name: user.name,
              username: null,
              avatarUrl: user.avatarUrl,
            }}
            size={32}
            borderColor="#FFFFFF"
          />
        </div>
      </div>
    );
  }

  // ── In progress, draft variant ───────────────────────────────────────────
  if (variant === "draft") {
    // The viewer's own piece — the exact DraftCard used on My Riffs.
    if (onClick) {
      return (
        <DraftCard
          piece={{
            id: piece.id,
            title: piece.title,
            preview: piece.preview ?? "",
            wordCount: piece.wordCount,
            createdAt: piece.createdAt ?? piece.updatedAt,
            dueDate: null,
          }}
          onClick={onClick}
        />
      );
    }

    // Everyone else's — same card chrome, but the body is fixed filler text
    // (never real content) behind a blur, since a piece's word count and
    // title are fine to reveal pre-submission but its actual writing isn't.
    return (
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          aspectRatio: "4 / 5",
          backgroundColor: "#FFFFFF",
          border: "2px solid #000000",
          padding: "20px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "8px",
            marginBottom: "8px",
          }}
        >
          <h4
            style={{
              fontFamily: "var(--font-dm-serif-text)",
              fontSize: "20px",
              fontWeight: 400,
              color: "#000000",
              margin: 0,
              lineHeight: 1.3,
              flex: 1,
              minWidth: 0,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {piece.title}
          </h4>
          <Avatar
            user={{
              id: user.id,
              name: user.name,
              username: null,
              avatarUrl: user.avatarUrl,
            }}
            size={24}
            borderColor="#FFFFFF"
          />
        </div>

        <div
          style={{
            position: "relative",
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              color: "#000000",
              lineHeight: 1.5,
              margin: 0,
              filter: "blur(4px)",
              userSelect: "none",
              pointerEvents: "none",
            }}
          >
            {BLURRED_PREVIEW_FILLER}
          </p>
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "28px",
              background: "linear-gradient(rgba(255,255,255,0), #FFFFFF)",
              pointerEvents: "none",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "12px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "12px",
              fontWeight: 300,
              color: "#808080",
            }}
          >
            Last activity {relativeTime(piece.updatedAt)}
          </span>
          <span
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "12px",
              fontWeight: 300,
              color: "#808080",
            }}
          >
            {piece.wordCount.toLocaleString()}{" "}
            {piece.wordCount === 1 ? "word" : "words"}
          </span>
        </div>
      </div>
    );
  }

  // ── In progress, noise variant (default) ─────────────────────────────────
  return (
    <div
      onClick={onClick}
      style={{ ...cardBase, cursor: onClick ? "pointer" : undefined }}
    >
      <NoiseBackground fillMode="cover" />

      {/* Dark overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 1,
        }}
      />

      {/* Title — vertically centered */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: "24px",
          paddingRight: "24px",
          paddingBottom: "24px",
          paddingLeft: "24px",
          zIndex: 2,
        }}
      >
        <h4
          style={{
            fontFamily: "var(--font-dm-serif-text)",
            fontSize: "20px",
            fontWeight: 400,
            color: "#FFFFFF",
            margin: 0,
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          {piece.title}
        </h4>
      </div>

      {/* Progress data — fixed position above avatar, doesn't shift with title */}
      <div
        style={{
          position: "absolute",
          bottom: "56px",
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          zIndex: 3,
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "rgba(255, 255, 255, 0.7)",
            margin: 0,
          }}
        >
          {piece.wordCount.toLocaleString()}{" "}
          {piece.wordCount === 1 ? "word" : "words"}
        </p>
        {showDate && (
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              color: "rgba(255, 255, 255, 0.7)",
              margin: 0,
            }}
          >
            {piece.activityLabel ?? relativeTime(piece.updatedAt)}
          </p>
        )}
      </div>

      {/* Avatar — bottom */}
      <div
        style={{
          position: "absolute",
          bottom: "16px",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          zIndex: 3,
        }}
      >
        <Avatar
          user={{
            id: user.id,
            name: user.name,
            username: null,
            avatarUrl: user.avatarUrl,
          }}
          size={32}
          borderColor="#FFFFFF"
        />
      </div>
    </div>
  );
}
