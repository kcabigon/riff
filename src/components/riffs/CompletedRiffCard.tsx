"use client";

import { useRouter } from "next/navigation";
import MosaicCollage from "./MosaicCollage";

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
    title: string;
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
        flexShrink: 0,
      }}
    >
      <MosaicCollage pieces={pieces} width={240} height={320} />

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
