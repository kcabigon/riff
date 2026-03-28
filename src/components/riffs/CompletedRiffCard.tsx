"use client";

import { useRouter } from "next/navigation";
import MosaicCollage from "./MosaicCollage";
import { getRiffDisplayTitle } from "@/lib/riff-utils";

interface CompletedRiffPiece {
  id: string;
  title: string;
  currentContent: string;
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
        flexShrink: 0,
      }}
    >
      <MosaicCollage pieces={pieces} width={240} height={320} />

      {/* Label strip — positioned at vertical center */}
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
    </div>
  );
}
