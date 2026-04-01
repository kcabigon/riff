"use client";

import { useState } from "react";
import Avatar from "@/components/shared/Avatar";

interface PieceCardProps {
  piece: {
    id: string;
    title: string;
    coverImage?: string | null;
    currentContent: string;
    wordCount?: number;
    commentCount?: number;
    author?: {
      id: string;
      name: string | null;
      avatarUrl: string | null;
    };
  };
  isRead: boolean;
  hasNewComments?: boolean;
  isOwnPiece?: boolean;
  onClick: () => void;
}

// Placeholder colors for pieces without images
const PLACEHOLDER_COLORS = [
  "#E8E0D5",
  "#D5E0E8",
  "#E0E8D5",
  "#E8D5E0",
  "#D5E8E0",
  "#E0D5E8",
];

export default function PieceCard({
  piece,
  isRead,
  hasNewComments = false,
  isOwnPiece = false,
  onClick,
}: PieceCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const imageUrl = piece.coverImage;
  const placeholderColor =
    PLACEHOLDER_COLORS[piece.id.charCodeAt(0) % PLACEHOLDER_COLORS.length];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "relative",
        border: "1px solid #000000",
        cursor: "pointer",
        overflow: "hidden",
        aspectRatio: "4 / 5",
        boxShadow: isHovered ? "8px 8px 0px 0px #000000" : "none",
        transition: "box-shadow 0.1s ease",
        backgroundColor: imageUrl ? undefined : placeholderColor,
      }}
    >
      {/* Cover image */}
      {imageUrl && (
        <img
          src={imageUrl}
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

      {/* Own piece — orange comment count top-left */}
      {isOwnPiece && (piece.commentCount ?? 0) > 0 && (
        <div
          style={{
            position: "absolute",
            top: "8px",
            left: "8px",
            backgroundColor: "#FF6B35",
            border: "1px solid #000000",
            padding: "2px 8px",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "11px",
            fontWeight: 700,
            color: "#000000",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            zIndex: 2,
          }}
        >
          {piece.commentCount}
        </div>
      )}

      {/* Top-right badge — UNREAD (green) for unread others' pieces, NEW (cyan) for new comments */}
      {!isOwnPiece && !isRead && (
        <div
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            backgroundColor: "#00FF66",
            border: "1px solid #000000",
            padding: "2px 8px",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "11px",
            fontWeight: 700,
            color: "#000000",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            zIndex: 2,
          }}
        >
          UNREAD
        </div>
      )}
      {!isOwnPiece && isRead && hasNewComments && (
        <div
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            backgroundColor: "#01EFFC",
            border: "1px solid #000000",
            padding: "2px 8px",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "11px",
            fontWeight: 700,
            color: "#000000",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            zIndex: 2,
          }}
        >
          NEW
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

      {/* Author avatar — bottom center, only when author is provided */}
      {piece.author && (
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
              id: piece.author.id,
              name: piece.author.name,
              username: null,
              avatarUrl: piece.author.avatarUrl,
            }}
            size={32}
            borderColor="#FFFFFF"
          />
        </div>
      )}
    </div>
  );
}
