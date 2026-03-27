"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AvatarStack from "@/components/shared/AvatarStack";
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

export default function ReadyToRevealCard({
  riff,
  readCount,
  totalPieces,
}: ReadyToRevealCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  // Get submitters (participants who have submitted pieces)
  const submitters = riff.participants.filter((p) =>
    riff.pieces.some((piece) => piece.piece.authorId === p.user.id)
  );

  // Calculate total word count
  const totalWords = riff.pieces.reduce(
    (sum, p) => sum + (p.piece.wordCount || 0),
    0
  );

  // Format word count
  const formatNumber = (n: number): string => n.toLocaleString();

  // CTA label
  const ctaLabel = readCount === 0 ? "Reveal" : "Continue reading";
  const ctaShadowColor = readCount === 0 ? "#01EFFC" : "#00FF66";

  const handleClick = () => {
    router.push(`/riffs/${riff.id}`);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        padding: "32px",
        maxWidth: "440px",
        margin: "0 auto",
      }}
    >
      {/* Title */}
      <h3
        style={{
          fontFamily: "var(--font-dm-serif-text)",
          fontSize: "28px",
          fontWeight: 400,
          color: "#000000",
          margin: 0,
          textAlign: "center",
        }}
      >
        {getRiffDisplayTitle(riff)}
      </h3>

      {/* Writer avatars */}
      {submitters.length > 0 && (
        <AvatarStack
          users={submitters.map((p) => p.user)}
          size={32}
          showBorder={false}
        />
      )}

      {/* Stats */}
      <p
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "16px",
          fontWeight: 300,
          color: "#000000",
          margin: 0,
          textAlign: "center",
        }}
      >
        <span style={{ fontWeight: 700 }}>{totalPieces}</span> pieces{" "}
        <span style={{ fontWeight: 700 }}>{formatNumber(totalWords)}</span>{" "}
        words
      </p>

      {/* Mosaic collage */}
      <div
        style={{
          border: "1px solid #000000",
          overflow: "hidden",
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
      </div>

      {/* CTA button */}
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: "400px",
          maxWidth: "100%",
          padding: "12px 48px",
          backgroundColor: isHovered ? "#00FF66" : "#FFFFFF",
          border: "2px solid #000000",
          boxShadow: isHovered
            ? "8px 8px 0px 0px #000000"
            : `8px 8px 0px 0px ${ctaShadowColor}`,
          fontFamily: "var(--font-dm-sans)",
          fontSize: "16px",
          fontWeight: 300,
          color: "#000000",
          cursor: "pointer",
          transition: "none",
          textAlign: "center",
        }}
      >
        {ctaLabel}
      </button>
    </div>
  );
}
