"use client";

import { useRouter } from "next/navigation";
import { useDraftCreation } from "@/hooks/useDraftCreation";
import CTAButton from "@/components/CTAButton";

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
  const router = useRouter();
  const { createDraft } = useDraftCreation();

  const label = !isJoined
    ? "Let's riff"
    : hasSubmitted
      ? "View submission"
      : hasDraft
        ? "Continue writing"
        : "Start writing";

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

  return <CTAButton onClick={handleClick}>{label}</CTAButton>;
}
