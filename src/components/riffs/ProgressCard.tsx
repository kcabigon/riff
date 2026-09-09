"use client";

import { useState } from "react";
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
    // Plain-text preview (truncated) — only meaningful (and only sent by
    // the server) for the viewer's own unsubmitted piece, rendered via
    // DraftCard below. Other participants' draft previews are faked from
    // wordCount alone (see blurredPreviewFiller) — never real content.
    preview?: string;
    createdAt?: string;
  } | null;
  // False hides the "Last activity" line on the in-progress noise-variant
  // card (the only remaining branch that reads it — RiffPageLayout's
  // pre-reveal grid). No current caller passes false; kept for callers that
  // want the card purely informational without a timestamp.
  showDate?: boolean;
  // Makes the whole card clickable instead of purely informational — jump
  // back into writing (own in-progress piece) or open the piece to read
  // (revealed/submitted piece). Caller decides eligibility; omit to leave
  // a card non-interactive (e.g. a locked pre-reveal piece).
  onClick?: () => void;
  // "draft" swaps the in-progress state's noise/dark-overlay treatment for a
  // DraftCard-style card — the real thing for the viewer's own piece (passed
  // via onClick), a blurred lookalike for everyone else's. Defaults to
  // "noise" so existing callers (e.g. the individual riff page) are unaffected.
  variant?: "noise" | "draft";
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

// Fixed filler paragraph used to fake other participants' draft previews —
// never real content, so there's nothing to leak. Long enough to cover the
// blurred preview's cap below without repeating.
const FILLER_PREVIEW_TEXT =
  "The story began quietly, the way most important things do, without any fanfare or warning that everything was about to change. She had always believed certain mornings carried more weight than others, though she could never explain why some felt heavier and slower than the rest of an ordinary week spent waiting for something worth remembering to finally arrive and settle into place. It was easier, she thought, to notice these things in hindsight than to trust the feeling while it was happening";
const FILLER_PREVIEW_WORDS = FILLER_PREVIEW_TEXT.split(" ");
const FILLER_PREVIEW_CAP = 60;

// Fakes a preview whose *length* matches the real word count, so the blur
// looks proportionally accurate (a 5-word draft reads as a sliver, a
// 50+-word one fills the card) without ever transmitting real content —
// only wordCount, which the app already sends regardless.
const blurredPreviewFiller = (wordCount: number): string =>
  FILLER_PREVIEW_WORDS.slice(0, Math.min(wordCount, FILLER_PREVIEW_CAP)).join(
    " "
  );

export default function ProgressCard({
  user,
  piece,
  showDate = true,
  onClick,
  variant = "noise",
}: ProgressCardProps) {
  // Hard-shadow-on-hover is the established affordance for a clickable card
  // (see PieceCard, DraftCard) — only wired where onClick is actually
  // present below, so a non-interactive card never implies it's clickable.
  const [isHovered, setIsHovered] = useState(false);
  const hoverProps = onClick
    ? {
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
      }
    : {};
  const hoverShadow = onClick && isHovered ? "8px 8px 0px 0px #000000" : "none";

  const cardBase: React.CSSProperties = {
    position: "relative",
    border: "1px solid #000000",
    overflow: "hidden",
    aspectRatio: "4 / 5",
  };

  // ── Not started ──────────────────────────────────────────────────────────
  if (!piece) {
    // Draft variant — same blank-card chrome as the other draft states,
    // just an avatar in the corner. No noise, no status text.
    if (variant === "draft") {
      return (
        <div
          onClick={onClick}
          {...hoverProps}
          style={{
            position: "relative",
            aspectRatio: "4 / 5",
            backgroundColor: "#FFFFFF",
            border: "2px dashed #CCCCCC",
            padding: "20px",
            cursor: onClick ? "pointer" : undefined,
            boxShadow: hoverShadow,
            transition: "box-shadow 0.1s ease",
          }}
        >
          <div style={{ position: "absolute", top: "20px", right: "20px" }}>
            <Avatar
              user={{
                id: user.id,
                name: user.name,
                username: null,
                avatarUrl: user.avatarUrl,
              }}
              size={32}
              borderColor="#000000"
            />
          </div>

          {/* "+" — only the viewer's own not-started card is clickable
              (start-writing affordance); other participants' blank cards
              stay purely informational. */}
          {onClick && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "48px",
                  fontWeight: 300,
                  color: "#808080",
                  lineHeight: 1,
                }}
              >
                +
              </span>
            </div>
          )}
        </div>
      );
    }

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
      // Always pre-reveal now — Current Read/Past Riffs render actual
      // readable pieces via PieceCard instead, so this card is never
      // clickable (a locked piece shouldn't be jumpable-to).
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

        {/* Lock icon — top center. This branch is only ever reached
            pre-reveal now (Current Read/Past Riffs use PieceCard once a
            piece is actually readable), so it's unconditional. */}
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
    // The viewer's own piece — the exact DraftCard used on My Riffs, plus an
    // avatar overlay so it matches the other draft-variant cards (which all
    // show one). Added here rather than in DraftCard itself, since that
    // component is also used on My Riffs, where there's no "other users" to
    // distinguish it from.
    if (onClick) {
      return (
        <div
          className="progress-card-own-draft"
          style={{ position: "relative" }}
        >
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
          <div style={{ position: "absolute", top: "20px", right: "20px" }}>
            <Avatar
              user={{
                id: user.id,
                name: user.name,
                username: null,
                avatarUrl: user.avatarUrl,
              }}
              size={32}
              borderColor="#000000"
            />
          </div>
          {/* DraftCard fixes itself to a 250px height below 639px, tuned
              for My Riffs' grid — override back to the same aspect-ratio
              every other card in this grid/carousel uses, so the viewer's
              own card doesn't stand out as a different size. Scoped here
              rather than in DraftCard.tsx, which My Riffs still uses as-is. */}
          <style>{`
            @media (max-width: 639px) {
              .progress-card-own-draft .draft-card {
                aspect-ratio: 4 / 5 !important;
                height: auto !important;
              }
            }
          `}</style>
        </div>
      );
    }

    // Everyone else's — same card chrome, but the body is a fixed filler
    // paragraph sliced to their real word count and blurred, so the preview
    // is proportionally accurate (matches how much they've actually written)
    // without ever rendering real content.
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
            size={32}
            borderColor="#000000"
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
          {piece.wordCount === 0 ? (
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "14px",
                fontWeight: 300,
                color: "#808080",
                margin: 0,
              }}
            >
              Just started
            </p>
          ) : (
            <>
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
                {blurredPreviewFiller(piece.wordCount)}
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
            </>
          )}
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
      {...hoverProps}
      style={{
        ...cardBase,
        cursor: onClick ? "pointer" : undefined,
        boxShadow: hoverShadow,
        transition: "box-shadow 0.1s ease",
      }}
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
