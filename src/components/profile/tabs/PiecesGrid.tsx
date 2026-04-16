"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import PieceCard from "@/components/riffs/PieceCard";
import Dropdown from "@/components/shared/Dropdown";
import type { DropdownItem } from "@/components/shared/Dropdown";
import { useIsMobile } from "@/hooks/useMediaQuery";

export interface Piece {
  id: string;
  title: string | null;
  coverImage: string | null;
  currentContent: string | null;
  isRevealed: boolean;
}

const PLACEHOLDER_COLORS = [
  "#E8E0D5",
  "#D5E0E8",
  "#E0E8D5",
  "#E8D5E0",
  "#D5E8E0",
  "#E0D5E8",
];

function extractExcerpt(content: string | null, maxChars = 240): string {
  if (!content) return "";
  try {
    const doc = JSON.parse(content) as {
      content?: unknown[];
      text?: string;
      type?: string;
    };
    const texts: string[] = [];
    const walk = (node: { text?: string; content?: unknown[] }) => {
      if (node.text) texts.push(node.text);
      if (node.content)
        (node.content as { text?: string; content?: unknown[] }[]).forEach(
          walk
        );
    };
    walk(doc);
    const full = texts.join(" ").replace(/\s+/g, " ").trim();
    return full.length > maxChars
      ? full.slice(0, maxChars).trimEnd() + "…"
      : full;
  } catch {
    const stripped = content
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return stripped.length > maxChars
      ? stripped.slice(0, maxChars).trimEnd() + "…"
      : stripped;
  }
}

function LockIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="white"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
    >
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
    </svg>
  );
}

function LockOverlay() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 4,
        cursor: "default",
        pointerEvents: "none",
      }}
    >
      <LockIcon
        style={{
          position: "absolute",
          top: "12px",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      />
    </div>
  );
}

// Three-dot menu — onDark for the featured hero (white dots on image overlay)
function PieceDotsMenu({
  items,
  onDark = false,
}: {
  items: DropdownItem[];
  onDark?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ position: "absolute", top: "8px", right: "8px", zIndex: 3 }}
      onClick={(e) => e.stopPropagation()}
    >
      <Dropdown
        trigger={
          <button
            aria-label="Piece options"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              background: hovered
                ? "#01EFFC"
                : onDark
                  ? "rgba(0,0,0,0.55)"
                  : "transparent",
              border: hovered ? "2px solid #000000" : "2px solid transparent",
              boxShadow: hovered ? "4px 4px 0px 0px #000000" : "none",
              cursor: "pointer",
              padding: "4px 6px",
              color: hovered ? "#000000" : onDark ? "#FFFFFF" : "#000000",
              lineHeight: 1,
              display: "flex",
              alignItems: "center",
              transition: "none",
            }}
          >
            <svg width="12" height="3" viewBox="0 0 12 3" fill="currentColor">
              <circle cx="1.5" cy="1.5" r="1.5" />
              <circle cx="6" cy="1.5" r="1.5" />
              <circle cx="10.5" cy="1.5" r="1.5" />
            </svg>
          </button>
        }
        items={items}
        align="right"
      />
    </div>
  );
}

export function FeaturedPiece({
  piece,
  onClick,
  isOwnProfile,
  onDelete,
}: {
  piece: Piece;
  onClick: () => void;
  isOwnProfile: boolean;
  onDelete: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const isMobile = useIsMobile();
  const placeholderColor =
    PLACEHOLDER_COLORS[piece.id.charCodeAt(0) % PLACEHOLDER_COLORS.length];
  const excerpt = extractExcerpt(piece.currentContent, isMobile ? 280 : 560);

  const menuItems: DropdownItem[] = [
    {
      type: "action",
      label: "Edit",
      onClick: () => router.push(`/write/${piece.id}`),
    },
    { type: "divider" },
    {
      type: "action",
      label: "Delete",
      color: "#DC2626",
      onClick: onDelete,
    },
  ];

  return (
    <div style={{ padding: "0 24px 0" }}>
      <div
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: "relative",
          width: "100%",
          height: "480px",
          border: "2px solid #000000",
          cursor: !piece.isRevealed && !isOwnProfile ? "default" : "pointer",
          overflow: "hidden",
          boxShadow: isHovered ? "8px 8px 0px 0px #000000" : "none",
          transition: "none",
          backgroundColor: piece.coverImage ? undefined : placeholderColor,
        }}
      >
        {piece.coverImage && (
          <Image
            src={piece.coverImage}
            alt=""
            fill
            style={{ objectFit: "cover" }}
          />
        )}

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)",
          }}
        />

        {!piece.isRevealed && (
          <div
            style={{
              position: "absolute",
              top: "16px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 3,
            }}
          >
            <LockIcon />
          </div>
        )}

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "32px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "11px",
              fontWeight: 700,
              color: "rgba(255,255,255,0.7)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Latest piece
          </div>
          <h2
            style={{
              fontFamily: "var(--font-dm-serif-text)",
              fontSize: "32px",
              fontWeight: 400,
              color: "#FFFFFF",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {piece.title || "Untitled"}
          </h2>
          {excerpt && (
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "rgba(255,255,255,0.8)",
                margin: 0,
                lineHeight: 1.6,
                maxWidth: "640px",
              }}
            >
              {excerpt}
            </p>
          )}
        </div>

        {isOwnProfile && <PieceDotsMenu items={menuItems} onDark={true} />}
      </div>
    </div>
  );
}

export default function PiecesGrid({
  pieces,
  isOwnProfile,
  onDelete,
}: {
  pieces: Piece[];
  isOwnProfile: boolean;
  onDelete: (id: string, title: string | null) => void;
}) {
  const router = useRouter();

  const menuItems = (piece: Piece): DropdownItem[] => [
    {
      type: "action",
      label: "Edit",
      onClick: () => router.push(`/write/${piece.id}`),
    },
    { type: "divider" },
    {
      type: "action",
      label: "Delete",
      color: "#DC2626",
      onClick: () => onDelete(piece.id, piece.title),
    },
  ];

  return (
    <div style={{ padding: "24px 0" }}>
      <style>{`
        .pieces-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          padding: 0 24px;
        }
        @media (max-width: 1023px) {
          .pieces-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 639px) {
          .pieces-grid { grid-template-columns: 1fr; padding: 0 24px; }
        }
      `}</style>
      <div className="pieces-grid">
        {pieces.map((piece) => {
          const isLocked = !piece.isRevealed;
          const handleClick = isLocked
            ? isOwnProfile
              ? () => router.push(`/write/${piece.id}`)
              : undefined
            : () => router.push(`/read/${piece.id}`);

          return (
            <div key={piece.id} style={{ position: "relative" }}>
              {isOwnProfile && (
                <PieceDotsMenu items={menuItems(piece)} onDark={false} />
              )}
              {isLocked && !isOwnProfile && <LockOverlay />}
              <PieceCard
                piece={{
                  id: piece.id,
                  title: piece.title || "Untitled",
                  coverImage: piece.coverImage,
                  currentContent: piece.currentContent || "",
                }}
                isRead={true}
                onClick={handleClick ?? (() => {})}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
