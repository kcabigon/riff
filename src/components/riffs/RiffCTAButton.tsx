"use client";

import { useRouter } from "next/navigation";
import CTAButton from "@/components/CTAButton";
import DraftChoiceTrigger from "./DraftChoiceTrigger";

interface RiffCTAButtonProps {
  riffId: string;
  isJoined: boolean;
  hasDraft: boolean;
  hasSubmitted: boolean;
  hasStandaloneDrafts: boolean;
  existingPieceId?: string | null;
  stopPropagation?: boolean;
}

export default function RiffCTAButton({
  riffId,
  isJoined,
  hasDraft,
  hasSubmitted,
  hasStandaloneDrafts,
  existingPieceId,
  stopPropagation = false,
}: RiffCTAButtonProps) {
  const router = useRouter();

  const label = !isJoined
    ? "Let's riff"
    : hasSubmitted
      ? "Submitted"
      : hasDraft
        ? "Continue writing"
        : "Start writing";

  // No piece yet (whether or not already joined — joining now only ever
  // happens as a side effect of picking New/Attach draft, so hasDraft can
  // never be true while unjoined) — hand off to the dropdown.
  if (!hasDraft && !hasSubmitted) {
    return (
      <DraftChoiceTrigger
        riffId={riffId}
        hasStandaloneDrafts={hasStandaloneDrafts}
        stopPropagation={stopPropagation}
        renderTrigger={(onClick) => (
          <CTAButton onClick={onClick}>{label}</CTAButton>
        )}
      />
    );
  }

  const handleClick = (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
    if (existingPieceId) {
      router.push(`/write/${existingPieceId}`);
    }
  };

  return (
    <CTAButton
      onClick={handleClick}
      disabled={hasSubmitted}
      style={hasSubmitted ? { opacity: 0.5 } : undefined}
    >
      {label}
    </CTAButton>
  );
}
