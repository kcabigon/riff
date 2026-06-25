"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/shared/Badge";
import PieceCard from "@/components/riffs/PieceCard";
import ThreeDotButton from "@/components/shared/ThreeDotButton";
import type { DropdownItem } from "@/components/shared/Dropdown";

export interface Piece {
  id: string;
  title: string | null;
  coverImage: string | null;
  isRevealed: boolean;
  viewerHasClubAccess: boolean;
  isPublic: boolean;
  publicShareId: string | null;
  preview?: string;
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
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setShowPreview(localStorage.getItem("riff-piece-preview") === "true");
  }, []);

  const togglePreview = () => {
    const next = !showPreview;
    setShowPreview(next);
    localStorage.setItem("riff-piece-preview", String(next));
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
      {isOwnProfile && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "0 24px 16px",
          }}
        >
          <button
            onClick={togglePreview}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "12px",
              fontWeight: 300,
              color: "#808080",
              padding: 0,
            }}
          >
            {showPreview ? "Hide previews" : "Show previews"}
          </button>
        </div>
      )}
      <div className="pieces-grid">
        {pieces.map((piece) => {
          const isLocked = !piece.isRevealed && !piece.isPublic;
          const handleClick = !piece.isRevealed
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
                showPreview={showPreview}
                preview={piece.preview}
                onClick={handleClick ?? (() => {})}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
