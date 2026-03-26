"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/shared/Modal";
import NoiseBackground from "@/components/NoiseBackground";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import Tagline from "@/components/Tagline";

interface ConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubName: string;
  onJoin: () => void;
  isJoining: boolean;
}

export default function ConversionModal({
  isOpen,
  onClose,
  clubName,
  onJoin,
  isJoining,
}: ConversionModalProps) {
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    if (isOpen) setStep(1);
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div
        style={{
          position: "relative",
          margin: "-40px",
          padding: "40px",
          overflow: "hidden",
        }}
      >
        <NoiseBackground fillMode="cover" />

        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "40px",
            right: "40px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#808080",
            fontSize: "20px",
            zIndex: 2,
            padding: "4px",
            lineHeight: 1,
          }}
        >
          ×
        </button>

        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
          }}
        >
          <OnboardingProgress currentStep={step} totalSteps={2} />

          {step === 1 ? (
            <>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-dm-serif-text)",
                    fontSize: "28px",
                    fontWeight: 400,
                    color: "#000000",
                    margin: 0,
                    textAlign: "center",
                  }}
                >
                  Like a book club, but
                </p>
                <Tagline
                  text="your own stories"
                  color="#00FF66"
                  textColor="#000000"
                  width={220}
                />
              </div>

              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "16px",
                  fontWeight: 300,
                  color: "#000000",
                  margin: 0,
                  textAlign: "center",
                  lineHeight: "1.6",
                }}
              >
                You and your friends, writing whatever you want, sharing once a
                month, purely for fun. A write club gives your friend group a
                shared purpose, some light structure, and total creative
                freedom.
              </p>

              <JoinButton
                clubName={clubName}
                onJoin={onJoin}
                isJoining={isJoining}
              />

              <button
                onClick={() => setStep(2)}
                style={{
                  background: "none",
                  border: "none",
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "14px",
                  fontWeight: 300,
                  color: "#959595",
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                  textDecorationColor: "#959595",
                }}
              >
                Cool, but what&apos;s a riff?
              </button>
            </>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-dm-serif-text)",
                    fontSize: "28px",
                    fontWeight: 400,
                    color: "#000000",
                    margin: 0,
                    textAlign: "center",
                  }}
                >
                  Writing with friends
                </p>
                <Tagline
                  text="feels like riffing"
                  color="#01EFFC"
                  textColor="#000000"
                  width={210}
                />
              </div>

              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "16px",
                  fontWeight: 300,
                  color: "#000000",
                  margin: 0,
                  textAlign: "center",
                  lineHeight: "1.6",
                }}
              >
                Riffs give a rhythm to the club. Write solo, your own style on
                your own time. Reveal together, on a set date that works for
                everyone. Keep the riff going in the comments section. Then run
                it back again.
              </p>

              <JoinButton
                clubName={clubName}
                onJoin={onJoin}
                isJoining={isJoining}
              />
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

function JoinButton({
  clubName,
  onJoin,
  isJoining,
}: {
  clubName: string;
  onJoin: () => void;
  isJoining: boolean;
}) {
  return (
    <button
      onClick={onJoin}
      disabled={isJoining}
      style={{
        backgroundColor: "#01EFFC",
        border: "2px solid #000000",
        boxShadow: "8px 8px 0px 0px #000000",
        padding: "12px 48px",
        fontFamily: "var(--font-dm-sans)",
        fontSize: "16px",
        fontWeight: 300,
        color: "#000000",
        cursor: isJoining ? "not-allowed" : "pointer",
        opacity: isJoining ? 0.7 : 1,
        transition: "background-color 0.2s ease, box-shadow 0.2s ease",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        if (!isJoining) {
          e.currentTarget.style.backgroundColor = "#FFFFFF";
          e.currentTarget.style.boxShadow = "8px 8px 0px 0px #01EFFC";
        }
      }}
      onMouseLeave={(e) => {
        if (!isJoining) {
          e.currentTarget.style.backgroundColor = "#01EFFC";
          e.currentTarget.style.boxShadow = "8px 8px 0px 0px #000000";
        }
      }}
      onMouseDown={(e) => {
        if (!isJoining) {
          e.currentTarget.style.transform = "translate(4px, 4px)";
          e.currentTarget.style.boxShadow = "4px 4px 0px 0px #000000";
        }
      }}
      onMouseUp={(e) => {
        if (!isJoining) {
          e.currentTarget.style.transform = "translate(0, 0)";
          e.currentTarget.style.boxShadow = "8px 8px 0px 0px #01EFFC";
        }
      }}
    >
      {isJoining ? "Joining..." : `Join ${clubName}`}
    </button>
  );
}
