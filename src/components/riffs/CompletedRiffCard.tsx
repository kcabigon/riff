"use client";

import { useRouter } from "next/navigation";
import { extractFirstImage } from "@/lib/extract-first-image";

interface CompletedRiffPiece {
  id: string;
  title: string;
  currentContent: string;
  wordCount: number;
}

interface CompletedRiffCardProps {
  riff: {
    id: string;
    title: string;
    createdAt: Date;
    deadline?: Date | null;
  };
  clubName: string;
  pieces: CompletedRiffPiece[];
}

// Placeholder color palette for pieces without images
const PLACEHOLDER_COLORS = [
  "#E8E0D5",
  "#D5E0E8",
  "#E0E8D5",
  "#E8D5E0",
  "#D5E8E0",
  "#E0D5E8",
];

export default function CompletedRiffCard({
  riff,
  clubName,
  pieces,
}: CompletedRiffCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/riffs/${riff.id}`);
  };

  // If no pieces, show a plain placeholder
  if (pieces.length === 0) {
    return (
      <div
        onClick={handleClick}
        style={{
          width: "240px",
          height: "320px",
          border: "1px solid #000000",
          boxShadow: "8px 8px 0px 0px #000000",
          backgroundColor: "#E6E6E6",
          position: "relative",
          cursor: "pointer",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* Label strip */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "-1px",
            width: "240px",
            transform: "translateY(-50%)",
            backgroundColor: "#000000",
            padding: "8px 12px",
            zIndex: 1,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-dm-serif-text)",
              fontSize: "12px",
              fontWeight: 400,
              color: "#FFFFFF",
              margin: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {clubName} | {riff.title}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      style={{
        width: "240px",
        height: "320px",
        border: "1px solid #000000",
        boxShadow: "8px 8px 0px 0px #000000",
        position: "relative",
        cursor: "pointer",
        overflow: "hidden",
        display: "flex",
        flexDirection: "row",
        flexShrink: 0,
      }}
    >
      {/* Mosaic slivers */}
      {pieces.map((piece, index) => {
        const imageUrl =
          extractFirstImage(piece.currentContent) ||
          PLACEHOLDER_COLORS[index % PLACEHOLDER_COLORS.length];
        const isPlaceholder = !extractFirstImage(piece.currentContent);

        return (
          <div
            key={piece.id}
            style={{
              flex: "1 0 0",
              height: "100%",
              position: "relative",
              overflow: "hidden",
              minWidth: 0,
            }}
          >
            {isPlaceholder ? (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: imageUrl,
                }}
              />
            ) : (
              <img
                src={imageUrl}
                alt=""
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  pointerEvents: "none",
                }}
              />
            )}
          </div>
        );
      })}

      {/* Label strip — positioned at vertical center */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "-1px",
          width: "240px",
          transform: "translateY(-50%)",
          backgroundColor: "#000000",
          padding: "8px 12px",
          zIndex: 1,
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-dm-serif-text)",
            fontSize: "12px",
            fontWeight: 400,
            color: "#FFFFFF",
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {clubName} | {riff.title}
        </p>
      </div>
    </div>
  );
}
