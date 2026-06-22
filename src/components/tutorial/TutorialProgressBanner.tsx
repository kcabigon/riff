"use client";

import { useIsMobile } from "@/hooks/useMediaQuery";

const STEPS = [
  { label: "Join riff", short: "Join" },
  { label: "Start writing", short: "Write" },
  { label: "Submit piece", short: "Submit" },
  { label: "Reveal riff", short: "Reveal" },
  { label: "Read & comment", short: "Comment" },
];

const STEP_CONFIG: Record<string, { activeIndex: number; hint: string }> = {
  "": {
    activeIndex: 1,
    hint: "The goal is to write your piece and submit anytime before the deadline. Your progress is visible, but your writing is private until the reveal.",
  },
  submitted: {
    activeIndex: 3,
    hint: "Submitted pieces are locked until the reveal. Once everyone submits or the deadline passes, the host will click Reveal riff.",
  },
  revealed: {
    activeIndex: 4,
    hint: "After the reveal, read what your friends wrote and have the riff go on in the comments.",
  },
  read: {
    activeIndex: 5,
    hint: "That's a riff. Now start or join a real one with your friends.",
  },
};

const PURPLE = "#955CB5";

interface TutorialProgressBannerProps {
  step: "" | "submitted" | "revealed" | "read";
}

export default function TutorialProgressBanner({
  step,
}: TutorialProgressBannerProps) {
  const isMobile = useIsMobile();
  const { activeIndex, hint } = STEP_CONFIG[step];
  const currentLabel =
    activeIndex < STEPS.length ? STEPS[activeIndex].label : "That's a riff.";

  return (
    <div
      style={{
        border: "2px solid #000000",
        boxShadow: "8px 8px 0px 0px #000000",
        backgroundColor: "#FFFFFF",
        padding: isMobile ? "20px" : "24px",
        marginBottom: "48px",
      }}
    >
      {/* Current step name */}
      <p
        style={{
          fontFamily: "var(--font-dm-serif-text)",
          fontSize: "20px",
          fontWeight: 400,
          color: "#000000",
          textAlign: "center",
          margin: "0 0 16px",
          lineHeight: 1.2,
        }}
      >
        {currentLabel}
      </p>

      {/* Step bars */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        {STEPS.map(({ label, short }, i) => {
          const isCompleted = i < activeIndex;
          const isActive = i === activeIndex;

          return (
            <div
              // eslint-disable-next-line react/no-array-index-key -- 5-step progress banner; length and order are stable
              key={i}
              style={{
                flex: 1,
                height: "40px",
                backgroundColor: isCompleted
                  ? "#000000"
                  : isActive
                    ? "#FFFFFF"
                    : "#E6E6E6",
                border: `2px solid ${isCompleted || isActive ? "#000000" : "#9C9C9C"}`,
                boxShadow: isActive ? `4px 4px 0px 0px ${PURPLE}` : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 4px",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "11px",
                  fontWeight: isActive ? 700 : isCompleted ? 400 : 300,
                  color: isCompleted
                    ? "#FFFFFF"
                    : isActive
                      ? "#000000"
                      : "#9C9C9C",
                  textAlign: "center",
                  lineHeight: 1.2,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}
              >
                {isMobile ? short : label}
                {isCompleted && !isMobile && " 🤘"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Hint text */}
      <p
        style={{
          fontFamily: "var(--font-dm-sans)",
          fontSize: "12px",
          fontWeight: 300,
          color: "#808080",
          margin: 0,
          lineHeight: 1.5,
          textAlign: "center",
        }}
      >
        {hint}
      </p>
    </div>
  );
}
