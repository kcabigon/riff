"use client";

import { useState } from "react";
import { formatDateShort } from "@/lib/riff-utils";

interface DraftCardProps {
  piece: {
    id: string;
    title: string;
    preview: string;
    wordCount: number;
    createdAt: string;
    dueDate: string | null;
  };
  onClick: () => void;
}

export default function DraftCard({ piece, onClick }: DraftCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="draft-card"
      style={{
        display: "flex",
        flexDirection: "column",
        aspectRatio: "4 / 5",
        backgroundColor: "#FFFFFF",
        border: "2px solid #000000",
        boxShadow: isHovered ? "8px 8px 0px 0px #000000" : "none",
        transition: "box-shadow 0.1s ease",
        cursor: "pointer",
        padding: "20px",
      }}
    >
      <h4
        style={{
          fontFamily: "var(--font-dm-serif-text)",
          fontSize: "20px",
          fontWeight: 400,
          color: "#000000",
          margin: "0 0 8px 0",
          lineHeight: 1.3,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {piece.title || "Untitled"}
      </h4>

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
          }}
        >
          {piece.preview}
        </p>

        {/* Fades the last (possibly partial) line instead of hard-cropping it */}
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
            color: piece.dueDate ? "#DC2626" : "#808080",
          }}
        >
          {piece.dueDate
            ? `Due by ${formatDateShort(piece.dueDate)}`
            : `Created on ${formatDateShort(piece.createdAt)}`}
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

      <style>{`
        @media (max-width: 639px) {
          .draft-card {
            aspect-ratio: auto !important;
            height: 250px !important;
          }
        }
      `}</style>
    </div>
  );
}
