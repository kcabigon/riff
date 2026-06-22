"use client";

import Avatar from "@/components/shared/Avatar";
import NoiseBackground from "@/components/NoiseBackground";
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
  } | null;
}

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

export default function ProgressCard({ user, piece }: ProgressCardProps) {
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

        {/* Lock icon — top center */}
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

  // ── In progress ──────────────────────────────────────────────────────────
  return (
    <div style={{ ...cardBase }}>
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
