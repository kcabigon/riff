"use client";

import Modal from "@/components/shared/Modal";
import CloseButton from "@/components/CloseButton";
import PrimaryButton from "@/components/PrimaryButton";

export type WhatsNextTrigger =
  | "host_created_club"
  | "host_started_riff"
  | "host_submitted"
  | "host_revealed"
  | "member_joined_club"
  | "member_joined_riff"
  | "member_submitted"
  | "member_first_reveal";

interface WhatsNextModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: WhatsNextTrigger;
  hostFirstName?: string | null;
  onCTAClick?: () => void;
}

const HOST_STEPS = [
  "Start the riff",
  "Write your piece",
  "Submit by deadline",
  "Reveal the riff",
];

const MEMBER_STEPS = [
  "Join the riff",
  "Write your piece",
  "Submit by deadline",
  "Read and comment",
];

// Index of last completed step. -1 = pre-journey (all steps previewed as upcoming).
const COMPLETED_STEP: Record<WhatsNextTrigger, number> = {
  host_created_club: -1,
  host_started_riff: 0,
  host_submitted: 2,
  host_revealed: 3,
  member_joined_club: -1,
  member_joined_riff: 0,
  member_submitted: 2,
  member_first_reveal: 3,
};

interface TriggerContent {
  heading: string;
  body: string;
  cta: string;
  steps: string[];
}

function getContent(
  trigger: WhatsNextTrigger,
  hostFirstName?: string | null
): TriggerContent {
  const host = hostFirstName || "your host";
  const map: Record<WhatsNextTrigger, TriggerContent> = {
    host_created_club: {
      heading: "Ain't a club without your friends…",
      body: "There are two types of people in this world: those who think writing is torture, and those who know writing is fun. Invite your friends of the second kind.",
      cta: "Invite your crew",
      steps: HOST_STEPS,
    },
    host_started_riff: {
      heading: "You got the party started…",
      body: "Your writers are off to the races. Check in to see who's started, and drop a reminder if the deadline is creeping up.",
      cta: "See the riff",
      steps: HOST_STEPS,
    },
    host_submitted: {
      heading: "Locked and loaded…",
      body: "Now you wait till the rest of the crew crosses the finish line. When you're ready, clicking that Reveal button is all you.",
      cta: "Sit tight",
      steps: HOST_STEPS,
    },
    host_revealed: {
      heading: "The moment you've been waiting for…",
      body: "You did it. Against all odds, you rallied friends to share long-form writing on the internet. Go enjoy these stories from your friends, and let the riff go on in the comments.",
      cta: "Start reading",
      steps: HOST_STEPS,
    },
    member_joined_club: {
      heading: "Welcome to write club…",
      body: "The first rule of write club is, everyone writes. The second rule of write club is, sometimes you wait. Practice patience until you see the Join Riff button, then it's on like Donkey Kong.",
      cta: "Got it",
      steps: MEMBER_STEPS,
    },
    member_joined_riff: {
      heading: "Blank page, meet your match",
      body: "Time to write like no one's watching (except they kind of are: your word count). You have one goal, submit a piece before the deadline.",
      cta: "Let's write",
      steps: MEMBER_STEPS,
    },
    member_submitted: {
      heading: "You did your part…",
      body: `Schwing! Now you wait till the rest of the crew crosses the finish line. When ready, ${host} will reveal the riff.`,
      cta: "Back to the riff",
      steps: MEMBER_STEPS,
    },
    member_first_reveal: {
      heading: "The moment you've been waiting for…",
      body: `The heart flutters at the sound of those three little words, "you've got mail." Go enjoy these stories from your friends. Let the riff go on in the comments.`,
      cta: "Start reading",
      steps: MEMBER_STEPS,
    },
  };
  return map[trigger];
}

function JourneyTracker({
  steps,
  completedStep,
}: {
  steps: string[];
  completedStep: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {steps.map((step, i) => {
        const isCompleted = i <= completedStep;
        const isCurrent = i === completedStep;
        const isLast = i === steps.length - 1;
        const dotColor = isCompleted ? "#00FF66" : "transparent";
        const dotBorder = isCompleted ? "#000000" : "#808080";
        const dotSize = isCurrent ? 14 : 10;
        const lineColor = i < completedStep ? "#00FF66" : "#CCCCCC";

        return (
          <div key={step} style={{ display: "flex", gap: "14px" }}>
            {/* Left column: dot + line */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flexShrink: 0,
                width: "14px",
              }}
            >
              <div
                style={{
                  width: `${dotSize}px`,
                  height: `${dotSize}px`,
                  borderRadius: "50%",
                  backgroundColor: dotColor,
                  border: `2px solid ${dotBorder}`,
                  flexShrink: 0,
                }}
              />
              {!isLast && (
                <div
                  style={{
                    width: "2px",
                    flex: 1,
                    minHeight: "20px",
                    backgroundColor: lineColor,
                  }}
                />
              )}
            </div>

            {/* Step label */}
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "12px",
                fontWeight: isCurrent ? 700 : 300,
                color: isCompleted ? "#000000" : "#808080",
                margin: 0,
                paddingBottom: !isLast ? "20px" : "0",
                lineHeight: 1.4,
              }}
            >
              {step}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default function WhatsNextModal({
  isOpen,
  onClose,
  trigger,
  hostFirstName,
  onCTAClick,
}: WhatsNextModalProps) {
  const content = getContent(trigger, hostFirstName);
  const completedStep = COMPLETED_STEP[trigger];
  const handleCTA = onCTAClick ?? onClose;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" noiseBackground>
      {/* Close button */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "8px",
        }}
      >
        <CloseButton onClick={onClose} size={24} />
      </div>

      {/* Heading */}
      <h2
        style={{
          fontFamily: "var(--font-dm-serif-text)",
          fontSize: "24px",
          fontWeight: 400,
          color: "#000000",
          margin: "0 0 16px 0",
          lineHeight: 1.2,
        }}
      >
        {content.heading}
      </h2>

      {/* Body */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "2px solid #000000",
          padding: "16px",
          marginBottom: "24px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#000000",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          {content.body}
        </p>
      </div>

      {/* Divider */}
      <div
        style={{
          width: "100%",
          height: "1px",
          backgroundColor: "#E6E6E6",
          marginBottom: "24px",
        }}
      />

      {/* Journey tracker */}
      <JourneyTracker steps={content.steps} completedStep={completedStep} />

      {/* Divider */}
      <div
        style={{
          width: "100%",
          height: "1px",
          backgroundColor: "#E6E6E6",
          margin: "24px 0",
        }}
      />

      {/* CTA */}
      <PrimaryButton onClick={handleCTA} style={{ width: "100%" }}>
        {content.cta}
      </PrimaryButton>
    </Modal>
  );
}
