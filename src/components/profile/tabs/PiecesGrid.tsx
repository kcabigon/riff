"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/shared/Badge";
import PieceCard from "@/components/riffs/PieceCard";
import ThreeDotButton from "@/components/shared/ThreeDotButton";
import type { DropdownItem } from "@/components/shared/Dropdown";

// Placeholder colors for pieces without images. Intentional pastel rotation.
/* eslint-disable riff/no-non-palette-colors */
const PLACEHOLDER_COLORS = [
  "#E8E0D5",
  "#D5E0E8",
  "#E0E8D5",
  "#E8D5E0",
  "#D5E8E0",
  "#E0D5E8",
];
/* eslint-enable riff/no-non-palette-colors */

export interface Piece {
  id: string;
  title: string | null;
  coverImage: string | null;
  isRevealed: boolean;
  viewerHasClubAccess: boolean;
  isPublic: boolean;
  publicShareId: string | null;
  preview?: string;
  submittedAt?: Date;
  wordCount?: number | null;
  readLengthMin?: number | null;
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

function PublicBadge({
  top = "8px",
  left = "8px",
}: {
  top?: string;
  left?: string;
}) {
  return (
    <Badge variant="pink" style={{ top, left, zIndex: 3 }}>
      Public
    </Badge>
  );
}

function LockOverlay() {
  return (
    <div
      style={{
        position: "absolute",
        top: "12px",
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        zIndex: 4,
        pointerEvents: "none",
      }}
    >
      <LockIcon />
    </div>
  );
}

type ViewMode = "grid" | "feed";

export default function PiecesGrid({
  pieces,
  isOwnProfile,
  profileUserId,
  onDelete,
  onShare,
}: {
  pieces: Piece[];
  isOwnProfile: boolean;
  profileUserId: string;
  onDelete: (id: string, title: string | null) => void;
  onShare: (pieceId: string) => void;
}) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  useEffect(() => {
    const saved = localStorage.getItem("riff-piece-view");
    if (saved === "feed" || saved === "grid") setViewMode(saved);
  }, []);

  const switchView = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("riff-piece-view", mode);
  };

  const menuItems = (piece: Piece): DropdownItem[] => [
    {
      type: "action",
      label: "Edit",
      onClick: () => router.push(`/write/${piece.id}`),
    },
    ...(piece.isRevealed
      ? [
          {
            type: "action" as const,
            label: "Access",
            onClick: () => onShare(piece.id),
          },
        ]
      : []),
    { type: "divider" },
    {
      type: "action",
      label: "Delete",
      color: "#DC2626",
      onClick: () => onDelete(piece.id, piece.title),
    },
  ];

  const handleClick = (piece: Piece) =>
    !piece.isRevealed
      ? isOwnProfile
        ? () => router.push(`/write/${piece.id}`)
        : piece.isPublic
          ? () => router.push(`/p/${piece.id}`)
          : undefined
      : isOwnProfile || piece.viewerHasClubAccess
        ? () =>
            router.push(
              `/read/${piece.id}?from=profile&userId=${profileUserId}`
            )
        : piece.isPublic
          ? () => router.push(`/p/${piece.id}`)
          : undefined;

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
        .feed-item { display: flex; flex-direction: column; gap: 12px; padding: 24px; border-bottom: 1px solid #E6E6E6; cursor: pointer; }
        .feed-item:hover { background-color: #F5F5F5; }
      `}</style>

      {/* View toggle */}
      {isOwnProfile && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "16px",
            padding: "0 24px 16px",
          }}
        >
          {(["grid", "feed"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => switchView(mode)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "12px",
                fontWeight: viewMode === mode ? 700 : 300,
                color: viewMode === mode ? "#000000" : "#808080",
                padding: 0,
                textTransform: "capitalize",
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      )}

      {/* Grid layout */}
      {viewMode === "grid" && (
        <div className="pieces-grid">
          {pieces.map((piece) => {
            const isLocked = !piece.isRevealed && !piece.isPublic;
            const onClick = handleClick(piece);
            return (
              <div key={piece.id} style={{ position: "relative" }}>
                {isOwnProfile && (
                  <div
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      zIndex: 3,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ThreeDotButton
                      variant="dark"
                      items={menuItems(piece)}
                      align="right"
                    />
                  </div>
                )}
                {piece.isPublic && <PublicBadge />}
                {isLocked && <LockOverlay />}
                <PieceCard
                  piece={{
                    id: piece.id,
                    title: piece.title || "Untitled",
                    coverImage: piece.coverImage,
                  }}
                  isRead={true}
                  onClick={onClick ?? (() => {})}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Feed layout */}
      {viewMode === "feed" && (
        <div>
          {pieces.map((piece) => {
            const onClick = handleClick(piece);
            const placeholderColor =
              PLACEHOLDER_COLORS[
                piece.id.charCodeAt(0) % PLACEHOLDER_COLORS.length
              ];
            const meta = [
              piece.submittedAt?.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              piece.readLengthMin ? `${piece.readLengthMin} min read` : null,
              piece.wordCount
                ? `${piece.wordCount.toLocaleString()} words`
                : null,
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <div
                key={piece.id}
                className="feed-item"
                onClick={onClick ?? undefined}
              >
                {/* Top row: thumbnail + title + metadata + menu */}
                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    alignItems: "flex-start",
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      width: "64px",
                      flexShrink: 0,
                      aspectRatio: "4 / 5",
                      position: "relative",
                      border: "1px solid #000000",
                      overflow: "hidden",
                      backgroundColor: piece.coverImage
                        ? undefined
                        : placeholderColor,
                    }}
                  >
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
                  </div>

                  {/* Title + metadata */}
                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: "8px",
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: "var(--font-dm-serif-text)",
                          fontSize: "24px",
                          fontWeight: 400,
                          color: "#000000",
                          margin: 0,
                          lineHeight: 1.25,
                        }}
                      >
                        {piece.title || "Untitled"}
                      </h3>
                      {isOwnProfile && (
                        <div
                          style={{ flexShrink: 0 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ThreeDotButton
                            variant="light"
                            items={menuItems(piece)}
                            align="right"
                          />
                        </div>
                      )}
                    </div>
                    {meta && (
                      <p
                        style={{
                          fontFamily: "var(--font-dm-sans)",
                          fontSize: "12px",
                          fontWeight: 300,
                          color: "#808080",
                          margin: 0,
                        }}
                      >
                        {meta}
                      </p>
                    )}
                  </div>
                </div>

                {/* Preview — full width below */}
                {piece.preview && (
                  <p
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "16px",
                      fontWeight: 300,
                      color: "#000000",
                      margin: 0,
                      lineHeight: 1.6,
                      display: "-webkit-box",
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {piece.preview}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
