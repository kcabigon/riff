"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MosaicCollage from "./MosaicCollage";
import { getRiffDisplayTitle } from "@/lib/riff-utils";

interface CompletedRiffPiece {
  id: string;
  title: string;
  coverImage?: string | null;
  wordCount: number;
}

interface CompletedRiffCardProps {
  riff: {
    id: string;
    title: string | null;
    volumeNumber?: number | null;
    status: string;
    createdAt: Date;
    deadline?: Date | null;
  };
  clubName: string;
  pieces: CompletedRiffPiece[];
}

export default function CompletedRiffCard({
  riff,
  clubName,
  pieces,
}: CompletedRiffCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    router.push(`/riffs/${riff.id}`);
  };

  const labelStrip = (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: 0,
        width: "100%",
        transform: "translateY(-50%)",
        backgroundColor: "#000000",
        padding: "8px 12px",
        zIndex: 1,
        boxSizing: "border-box",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-dm-serif-text)",
          fontSize: "12px",
          fontWeight: 400,
          color: "#FFFFFF",
          margin: 0,
          textAlign: "center",
        }}
      >
        {getRiffDisplayTitle(riff)}
      </p>
    </div>
  );

  const cardStyle = {
    width: "240px",
    height: "320px",
    border: "2px solid #000000",
    boxShadow: isHovered
      ? "8px 8px 0px 0px #01EFFC"
      : "8px 8px 0px 0px #000000",
    position: "relative" as const,
    cursor: "pointer",
    overflow: "hidden",
    flexShrink: 0,
    transition: "none",
  };

  // If no pieces, show a plain placeholder
  if (pieces.length === 0) {
    return (
      <div
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ ...cardStyle, backgroundColor: "#E6E6E6" }}
      >
        {labelStrip}
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={cardStyle}
    >
      <MosaicCollage pieces={pieces} width={240} height={320} />
      {labelStrip}
    </div>
  );
}
