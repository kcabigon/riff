"use client";

import { useState } from "react";
import Avatar from "@/components/shared/Avatar";
import { extractFirstImage } from "@/lib/extract-first-image";

interface PieceCardProps {
  piece: {
    id: string;
    title: string;
    coverImage?: string | null;
    currentContent: string;
    wordCount: number;
    author: {
      id: string;
      name: string | null;
      avatarUrl: string | null;
    };
  };
  isRead: boolean;
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
  onClick,
}: PieceCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const imageUrl =
    piece.coverImage || extractFirstImage(piece.currentContent);
  const placeholderColor =
    PLACEHOLDER_COLORS[
      piece.id.charCodeAt(0) % PLACEHOLDER_COLORS.length
    ];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        border: "1px solid #000000",
        borderLeft: !isRead ? "3px solid #00FF66" : "1px solid #000000",
        cursor: "pointer",
        overflow: "hidden",
        boxShadow: isHovered ? "4px 4px 0px 0px #000000" : "none",
        transition: "box-shadow 0.1s ease",
        backgroundColor: "#FFFFFF",
      }}
    >
      {/* Cover image area */}
      <div
        style={{
          width: "100%",
          height: "180px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: placeholderColor,
            }}
          />
        )}

        {/* NEW badge for unread */}
        {!isRead && (
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
            }}
          >
            NEW
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "16px" }}>
        {/* Title */}
        <h4
          style={{
            fontFamily: "var(--font-dm-serif-text)",
            fontSize: "18px",
            fontWeight: 400,
            color: "#000000",
            margin: "0 0 8px 0",
            lineHeight: 1.3,
          }}
        >
          {piece.title}
        </h4>

        {/* Author */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "4px",
          }}
        >
          <Avatar
            user={{
              id: piece.author.id,
              name: piece.author.name,
              username: null,
              avatarUrl: piece.author.avatarUrl,
            }}
            size={24}
          />
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              fontWeight: 300,
              color: "#808080",
              margin: 0,
            }}
          >
            {piece.author.name || "Unknown"}
          </p>
        </div>

        {/* Word count */}
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            fontWeight: 300,
            color: "#AFAFAF",
            margin: 0,
          }}
        >
          {piece.wordCount.toLocaleString()} words
        </p>
      </div>
    </div>
  );
}
