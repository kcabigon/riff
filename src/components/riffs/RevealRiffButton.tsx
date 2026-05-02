"use client";

import CTAButton from "@/components/CTAButton";

export interface RevealRiffParams {
  deadlinePassed: boolean;
  isJoined: boolean;
  hasSubmitted: boolean;
  piecesAllSubmitted: boolean;
  isAdmin: boolean;
  status: string;
}

export function shouldShowReveal(p: RevealRiffParams): boolean {
  return (
    ((p.deadlinePassed && (!p.isJoined || p.hasSubmitted)) ||
      p.piecesAllSubmitted) &&
    p.isAdmin &&
    p.status === "ACTIVE"
  );
}

interface RevealRiffButtonProps extends RevealRiffParams {
  onClick: (e: React.MouseEvent) => void;
}

export default function RevealRiffButton({
  onClick,
  ...params
}: RevealRiffButtonProps) {
  if (!shouldShowReveal(params)) return null;

  return <CTAButton onClick={onClick}>Reveal riff</CTAButton>;
}
