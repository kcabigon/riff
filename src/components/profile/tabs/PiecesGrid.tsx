"use client";

import { useRouter } from "next/navigation";
import PieceCard from "@/components/riffs/PieceCard";

interface Piece {
  id: string;
  title: string | null;
  coverImage: string | null;
  currentContent: string | null;
}

interface PiecesGridProps {
  pieces: Piece[];
}

export default function PiecesGrid({ pieces }: PiecesGridProps) {
  const router = useRouter();

  if (pieces.length === 0) {
    return (
      <div
        style={{
          padding: "64px 24px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#808080",
            margin: 0,
          }}
        >
          No pieces yet.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px 0",
        width: "100%",
      }}
    >
      <style>{`
        .pieces-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          padding: 0 24px;
        }
        @media (max-width: 1023px) {
          .pieces-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 639px) {
          .pieces-grid {
            grid-template-columns: 1fr;
            padding: 0 16px;
          }
        }
      `}</style>
      <div className="pieces-grid">
        {pieces.map((piece) => (
          <PieceCard
            key={piece.id}
            piece={{
              id: piece.id,
              title: piece.title || "Untitled",
              coverImage: piece.coverImage,
              currentContent: piece.currentContent || "",
            }}
            isRead={true}
            onClick={() => router.push(`/pieces/${piece.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
