"use client";

import { useRouter } from "next/navigation";

interface PieceInfo {
  id: string;
  title: string;
}

interface PieceNavigationProps {
  previousPiece: PieceInfo | null;
  nextPiece: PieceInfo | null;
  riffId: string;
}

export default function PieceNavigation({
  previousPiece,
  nextPiece,
  riffId,
}: PieceNavigationProps) {
  const router = useRouter();

  if (!previousPiece && !nextPiece) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#FFFFFF",
        borderTop: "1px solid #E6E6E6",
        padding: "12px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 50,
      }}
    >
      {previousPiece ? (
        <button
          onClick={() => router.push(`/read/${previousPiece.id}?riff=${riffId}`)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            fontWeight: 300,
            color: "#000000",
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            maxWidth: "45%",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {previousPiece.title}
          </span>
        </button>
      ) : (
        <div />
      )}

      {nextPiece ? (
        <button
          onClick={() => router.push(`/read/${nextPiece.id}?riff=${riffId}`)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            fontWeight: 300,
            color: "#000000",
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            maxWidth: "45%",
          }}
        >
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {nextPiece.title}
          </span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M6 12L10 8L6 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : (
        <div />
      )}
    </div>
  );
}
