"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MosaicCollage from "./MosaicCollage";
import Badge from "@/components/shared/Badge";
import { getRiffDisplayTitle } from "@/lib/riff-utils";
import { useIsMobile } from "@/hooks/useMediaQuery";

interface ReadyToRevealCardProps {
  riff: {
    id: string;
    title: string | null;
    volumeNumber?: number | null;
    status: string;
    participants: Array<{
      user: {
        id: string;
        name: string | null;
        username: string | null;
        avatarUrl: string | null;
      };
    }>;
    pieces: Array<{
      submittedAt: string | Date | null;
      piece: {
        id: string;
        title: string;
        coverImage?: string | null;
        wordCount: number;
        authorId: string;
      };
    }>;
  };
  readCount: number;
  totalPieces: number;
}

export default function ReadyToRevealCard({
  riff,
  readCount,
  totalPieces,
}: ReadyToRevealCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const isMobile = useIsMobile();

  const cardWidth = isMobile ? 320 : 400;
  const cardHeight = isMobile ? 352 : 440;

  const handleClick = () => {
    router.push(`/riffs/${riff.id}`);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
      }}
    >
      <div
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          position: "relative",
          cursor: "pointer",
          width: `${cardWidth}px`,
          height: `${cardHeight}px`,
          margin: "0 auto",
          border: "1px solid #000000",
          boxShadow: isHovered
            ? "8px 8px 0px 0px #01EFFC"
            : "8px 8px 0px 0px #000000",
          overflow: "hidden",
          transition: "none",
        }}
      >
        <MosaicCollage
          pieces={riff.pieces
            .filter((p) => p.submittedAt !== null)
            .map((p) => ({
              id: p.piece.id,
              coverImage: p.piece.coverImage,
            }))}
          width={cardWidth}
          height={cardHeight}
        />

        {/* Unread badge */}
        {totalPieces - readCount > 0 && (
          <Badge variant="green" style={{ zIndex: 2 }}>
            {totalPieces - readCount} unread
          </Badge>
        )}

        {/* Label strip — vertically centered */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 0,
            width: "100%",
            transform: "translateY(-50%)",
            backgroundColor: "#000000",
            padding: "13px 20px",
            zIndex: 1,
            boxSizing: "border-box",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-dm-serif-text)",
              fontSize: "20px",
              fontWeight: 400,
              color: "#FFFFFF",
              margin: 0,
              textAlign: "center",
            }}
          >
            {getRiffDisplayTitle(riff)}
          </p>
        </div>
      </div>
    </div>
  );
}
