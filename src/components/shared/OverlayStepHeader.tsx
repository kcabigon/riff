"use client";

import BackButton from "@/components/BackButton";

interface OverlayStepHeaderProps {
  /** Shown on the flow's first step, where there's nothing to go back to. */
  heading?: string;
  /** Shown on later steps. Ignored when `heading` is set. */
  onBack?: () => void;
}

// The top row of a creation-flow card. Step 1 has no back target (back would
// just close the overlay, which the X already does), so it gets a heading
// instead — sized to the back arrow's row height so the fields below it stay
// put when the row swaps to an arrow on later steps. Callers that want
// neither pass neither.
export default function OverlayStepHeader({
  heading,
  onBack,
}: OverlayStepHeaderProps) {
  if (heading) {
    return (
      <div
        style={{
          width: "100%",
          height: "32px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-dm-serif-text)",
            fontSize: "24px",
            fontWeight: 400,
            lineHeight: "32px",
            color: "#000000",
            margin: 0,
          }}
        >
          {heading}
        </h1>
      </div>
    );
  }

  if (onBack) {
    return (
      <div style={{ width: "100%", display: "flex" }}>
        <BackButton onClick={onBack} />
      </div>
    );
  }

  return null;
}
