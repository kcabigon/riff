"use client";

import { useRouter } from "next/navigation";
import CTAButton from "@/components/CTAButton";
import DraftChoiceTrigger from "./DraftChoiceTrigger";

interface RiffCTAButtonProps {
  riffId: string;
  hasDraft: boolean;
  hasSubmitted: boolean;
  hasStandaloneDrafts: boolean;
  existingPieceId?: string | null;
  stopPropagation?: boolean;
}

export default function RiffCTAButton({
  riffId,
  hasDraft,
  hasSubmitted,
  hasStandaloneDrafts,
  existingPieceId,
  stopPropagation = false,
}: RiffCTAButtonProps) {
  const router = useRouter();

  // One label for "you have no piece in this riff", whether or not a
  // RiffParticipant row exists yet. It used to split — "Let's riff" unjoined,
  // "Start writing" joined-without-a-draft — but both run the identical path
  // below, and the split partitioned by role rather than by action: whoever
  // activates a riff is auto-joined by the DRAFT -> ACTIVE transition
  // (riffs/[id]/route.ts), so a host only ever saw "Start writing", while a
  // member's join and draft are one atomic step so they only ever saw "Let's
  // riff". Two words for one button.
  //
  // "Start writing" rather than "Let's riff" because it names the action the
  // button actually performs. It reads as one series with "Continue writing"
  // below it, too.
  const label = hasSubmitted
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
