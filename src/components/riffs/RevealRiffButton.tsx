"use client";

import CTAButton from "@/components/CTAButton";

export interface RevealRiffParams {
  deadlinePassed: boolean;
  isJoined: boolean;
  hasSubmitted: boolean;
  piecesAllSubmitted: boolean;
  isAdmin: boolean;
  status: string;
  // The club's cadence reveals it at the deadline — no button for the host
  autoReveals: boolean;
}

export function shouldShowReveal(p: RevealRiffParams): boolean {
  if (p.autoReveals) return false;
  return (
    ((p.deadlinePassed && (!p.isJoined || p.hasSubmitted)) ||
      p.piecesAllSubmitted) &&
    p.isAdmin &&
    p.status === "ACTIVE"
  );
}

export default function RevealRiffButton({
  onClick,
}: {
  onClick: (e: React.MouseEvent) => void;
}) {
  return <CTAButton onClick={onClick}>Reveal riff</CTAButton>;
}
