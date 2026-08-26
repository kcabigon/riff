"use client";

import { useState } from "react";
import Avatar from "@/components/shared/Avatar";
import Badge from "@/components/shared/Badge";

interface PieceCardProps {
  piece: {
    id: string;
    title: string;
    coverImage?: string | null;
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
  label?: string;
  onClick: () => void;
}

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

export default function PieceCard({
  piece,
  isRead,
  hasNewComments = false,
  isOwnPiece = false,
  label,
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

      {/* Own piece — comment count top-right */}
      {isOwnPiece && (piece.commentCount ?? 0) > 0 && (
        <Badge variant="yellow" style={{ zIndex: 2 }}>
          {piece.commentCount}{" "}
          {piece.commentCount === 1 ? "comment" : "comments"}
        </Badge>
      )}

      {/* Top-right badge — UNREAD for unread others' pieces, NEW COMMENTS for new activity */}
      {!isOwnPiece && !isRead && (
        <Badge variant="green" style={{ zIndex: 2 }}>
          Unread
        </Badge>
      )}
      {!isOwnPiece && isRead && hasNewComments && (
        <Badge variant="cyan" style={{ zIndex: 2 }}>
          New Comments
        </Badge>
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

      {/* Optional label — same position as ProgressCard activity text */}
      {label && (
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
            {label}
          </p>
        </div>
      )}

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
