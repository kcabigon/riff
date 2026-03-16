"use client";

import { useState } from "react";

interface EmptyRiffStateProps {
  onStartNewRiff: () => void;
  isAdmin?: boolean;
}

export default function EmptyRiffState({
  onStartNewRiff,
  isAdmin = true,
}: EmptyRiffStateProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (!isAdmin) {
    return (
      <div
        style={{
          padding: "40px",
          backgroundColor: "#F9F9F9",
          border: "2px dashed #E6E6E6",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#959595",
            margin: 0,
          }}
        >
          The host will start a riff soon.
        </p>
      </div>
    );
  }

  return (
    <div
      className="empty-riff-cta"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        width: "100%",
      }}
    >
      {/* Description */}
      <p
        className="empty-riff-text"
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "16px",
          fontWeight: 300,
          color: "#000000",
          margin: 0,
          flex: 1,
        }}
      >
        No riff yet &mdash; kick things off with a new one.
      </p>

      {/* Action Button */}
      <button
        onClick={onStartNewRiff}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="empty-riff-button"
        style={{
          backgroundColor: isHovered ? "#00FF66" : "#FFFFFF",
          border: "2px solid #000000",
          boxShadow: isHovered
            ? "8px 8px 0px 0px #000000"
            : "8px 8px 0px 0px #01EFFC",
          padding: "12px 48px",
          fontFamily: "var(--font-dm-sans)",
          fontSize: "16px",
          fontWeight: 300,
          color: "#000000",
          cursor: "pointer",
          transition: "none",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        Start new riff
      </button>

      <style>{`
        @media (max-width: 767px) {
          .empty-riff-cta {
            flex-direction: column !important;
          }
          .empty-riff-text {
            text-align: center !important;
          }
          .empty-riff-button {
            width: 100% !important;
            text-align: center !important;
          }
        }
      `}</style>
    </div>
  );
}
