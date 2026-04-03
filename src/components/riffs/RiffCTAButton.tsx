"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDraftCreation } from "@/hooks/useDraftCreation";

interface RiffCTAButtonProps {
  riffId: string;
  isJoined: boolean;
  hasDraft: boolean;
  hasSubmitted: boolean;
  existingPieceId?: string | null;
  onJoin?: () => void;
  stopPropagation?: boolean;
}

export default function RiffCTAButton({
  riffId,
  isJoined,
  hasDraft,
  hasSubmitted,
  existingPieceId,
  onJoin,
  stopPropagation = false,
}: RiffCTAButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const { createDraft } = useDraftCreation();

  const label = !isJoined
    ? "Join riff"
    : hasSubmitted
      ? "View submission"
      : hasDraft
        ? "Continue writing"
        : "Start writing";

  const buttonStyle = {
    backgroundColor: isHovered ? "#00FF66" : "#FFFFFF",
    border: "2px solid #000000",
    boxShadow: isHovered
      ? "8px 8px 0px 0px #000000"
      : isJoined
        ? "8px 8px 0px 0px #00FF66"
        : "8px 8px 0px 0px #01EFFC",
    padding: "12px 48px",
    fontFamily: "var(--font-dm-sans)",
    fontSize: "16px",
    fontWeight: 300,
    lineHeight: "normal",
    color: "#000000",
    cursor: "pointer",
    transition: "none",
    whiteSpace: "nowrap" as const,
  };

  const handleJoin = async (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
    try {
      const res = await fetch(`/api/riffs/${riffId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok && onJoin) onJoin();
    } catch (err) {
      console.error("Error joining riff:", err);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
    if (!isJoined) {
      handleJoin(e);
      return;
    }
    if (existingPieceId) {
      router.push(`/write/${existingPieceId}`);
    } else {
      createDraft(riffId);
    }
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={buttonStyle}
    >
      {label}
    </button>
  );
}
