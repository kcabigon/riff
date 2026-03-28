"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MosaicCollage from "./MosaicCollage";
import { getRiffDisplayTitle } from "@/lib/riff-utils";

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
      piece: {
        id: string;
        title: string;
        currentContent: string;
        coverImage?: string | null;
        wordCount: number;
        authorId: string;
      };
    }>;
  };
  readCount: number;
  totalPieces: number;
}

export default function ReadyToRevealCard({ riff }: ReadyToRevealCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    router.push(`/riffs/${riff.id}`);
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: "relative",
        cursor: "pointer",
        border: "1px solid #000000",
        boxShadow: isHovered
          ? "8px 8px 0px 0px #01EFFC"
          : "8px 8px 0px 0px #000000",
        overflow: "hidden",
        transition: "none",
        display: "inline-block",
      }}
    >
      <MosaicCollage
        pieces={riff.pieces.map((p) => ({
          id: p.piece.id,
          currentContent: p.piece.currentContent,
          coverImage: p.piece.coverImage,
        }))}
        width={400}
        height={440}
      />

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
  );
}
