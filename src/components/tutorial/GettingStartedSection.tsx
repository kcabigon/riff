"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NoiseBackground from "@/components/NoiseBackground";
import CTAButton from "@/components/CTAButton";
import CloseButton from "@/components/CloseButton";
import SampleRiffCard from "@/components/tutorial/SampleRiffCard";

const SUBTITLE_WORDS = [
  "your",
  "private",
  "space",
  "to",
  "riff",
  "with",
  "friends",
];

function DoneButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => onClick && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        border: "2px solid #000",
        padding: "12px 48px",
        fontFamily: "var(--font-dm-sans)",
        fontSize: "16px",
        fontWeight: 300,
        color: "#000",
        textAlign: "center",
        boxSizing: "border-box",
        backgroundColor: "#00FF66",
        boxShadow:
          hovered && onClick
            ? "4px 4px 0px 0px #955CB5"
            : "4px 4px 0px 0px #000",
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
        transition: "box-shadow 0.1s ease",
      }}
    >
      ✓ {children}
    </div>
  );
}

type GettingStartedSectionProps = {
  userId: string;
} & (
  | {
      variant: "host";
      clubId: string;
      clubName: string;
      step1Done: boolean;
      step2Done: boolean;
      onStartRiff: () => void;
      onInvite: () => void;
    }
  | {
      variant: "member";
      clubId: string;
      clubName: string;
      activeRiffId: string | null;
      avatarDone: boolean;
    }
  | {
      variant: "no-club";
      avatarDone: boolean;
    }
);

export default function GettingStartedSection(
  props: GettingStartedSectionProps
) {
  const { userId } = props;
  const router = useRouter();

  const clubId = props.variant !== "no-club" ? props.clubId : undefined;
  const clubName = props.variant !== "no-club" ? props.clubName : undefined;
  const isNoClub = props.variant === "no-club";

  const dismissKey = `getting-started-dismissed-${props.variant}-${userId}`;

  const [dismissed, setDismissed] = useState(false);
  const [showSampleRiff, setShowSampleRiff] = useState(false);
  const [sampleRiffDone, setSampleRiffDone] = useState(false);

  useEffect(() => {
    if (!isNoClub && localStorage.getItem(dismissKey)) setDismissed(true);
    if (localStorage.getItem(`tutorial-complete-user-${userId}`))
      setSampleRiffDone(true);
    else if (sessionStorage.getItem("tutorial-step") !== null)
      setShowSampleRiff(true);
  }, [dismissKey, userId, isNoClub]);

  const handleDismiss = () => {
    localStorage.setItem(dismissKey, "1");
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <>
      <div
        style={{
          position: "relative",
          marginBottom: showSampleRiff ? "16px" : "48px",
          border: "2px solid #000",
          overflow: "hidden",
        }}
      >
        <NoiseBackground fillMode="cover" />

        {!isNoClub && (
          <div
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              zIndex: 2,
            }}
          >
            <CloseButton onClick={handleDismiss} size={24} />
          </div>
        )}

        <div
          style={{ position: "relative", zIndex: 1, padding: "40px 40px 48px" }}
        >
          <div
            style={{
              fontFamily: "var(--font-dm-serif-text)",
              fontSize: "36px",
              fontWeight: 400,
              color: "#000",
              marginBottom: "8px",
              lineHeight: 1.1,
            }}
          >
            {isNoClub ? (
              <>
                Welcome to{" "}
                <span
                  style={{
                    fontFamily: "var(--font-playfair)",
                    fontWeight: 700,
                    fontStyle: "italic",
                  }}
                >
                  Riff
                </span>
              </>
            ) : (
              `Welcome to ${clubName}`
            )}
          </div>

          <div
            style={{
              fontFamily: "var(--font-over-the-rainbow)",
              fontSize: "22px",
              color: "#000",
              marginBottom: "32px",
              lineHeight: 1.4,
            }}
          >
            {isNoClub
              ? "but first you need a write club"
              : SUBTITLE_WORDS.join(" ")}
          </div>

          <div
            className="getting-started-ctas"
            style={{ display: "flex", gap: "16px" }}
          >
            {/* Step 1: Learn to riff — shared across all variants */}
            <div style={{ flex: 1 }}>
              {sampleRiffDone ? (
                <DoneButton onClick={() => setShowSampleRiff(true)}>
                  Learn to riff
                </DoneButton>
              ) : (
                <CTAButton
                  onClick={() => setShowSampleRiff(true)}
                  accentColor="#955CB5"
                  style={{ width: "100%" }}
                >
                  Learn to riff
                </CTAButton>
              )}
            </div>

            {props.variant === "host" && (
              <>
                <div style={{ flex: 1 }}>
                  {props.step1Done ? (
                    <DoneButton>Start new riff</DoneButton>
                  ) : (
                    <CTAButton
                      onClick={props.onStartRiff}
                      style={{ width: "100%" }}
                    >
                      Start new riff
                    </CTAButton>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  {props.step2Done ? (
                    <DoneButton>Invite friends</DoneButton>
                  ) : (
                    <CTAButton
                      onClick={props.onInvite}
                      accentColor="#01EFFC"
                      style={{ width: "100%" }}
                    >
                      Invite friends
                    </CTAButton>
                  )}
                </div>
              </>
            )}

            {props.variant === "member" && (
              <>
                <div style={{ flex: 1 }}>
                  {props.avatarDone ? (
                    <DoneButton>Upload avatar</DoneButton>
                  ) : (
                    <CTAButton
                      onClick={() => router.push("/account")}
                      accentColor="#01EFFC"
                      style={{ width: "100%" }}
                    >
                      Upload avatar
                    </CTAButton>
                  )}
                </div>

                {props.activeRiffId && (
                  <div style={{ flex: 1 }}>
                    <CTAButton
                      onClick={() =>
                        router.push(`/riffs/${props.activeRiffId}`)
                      }
                      style={{ width: "100%" }}
                    >
                      Join riff & submit
                    </CTAButton>
                  </div>
                )}
              </>
            )}

            {props.variant === "no-club" && (
              <>
                <div style={{ flex: 1 }}>
                  {props.avatarDone ? (
                    <DoneButton>Upload avatar</DoneButton>
                  ) : (
                    <CTAButton
                      onClick={() => router.push("/account")}
                      accentColor="#01EFFC"
                      style={{ width: "100%" }}
                    >
                      Upload avatar
                    </CTAButton>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <CTAButton
                    onClick={() => router.push("/onboarding/club-choice")}
                    style={{ width: "100%" }}
                  >
                    Start or join club
                  </CTAButton>
                </div>
              </>
            )}
          </div>
        </div>

        <style>{`
        @media (max-width: 767px) {
          .getting-started-ctas {
            flex-direction: column !important;
          }
        }
      `}</style>
      </div>

      {showSampleRiff && (
        <div style={{ marginBottom: "48px" }}>
          <SampleRiffCard
            clubId={clubId}
            onDismiss={() => setShowSampleRiff(false)}
          />
        </div>
      )}
    </>
  );
}
