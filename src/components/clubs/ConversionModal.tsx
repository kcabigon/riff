"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/shared/Modal";
import CloseButton from "@/components/CloseButton";
import NoiseBackground from "@/components/NoiseBackground";
import Tagline from "@/components/Tagline";
import SecondaryButton from "@/components/SecondaryButton";

interface ConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubName?: string;
  ctaLabel?: string;
  onJoin: () => void;
  isJoining: boolean;
}

export default function ConversionModal({
  isOpen,
  onClose,
  clubName,
  ctaLabel,
  onJoin,
  isJoining,
}: ConversionModalProps) {
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    if (isOpen) setStep(1);
  }, [isOpen]);

  const resolvedCtaLabel = ctaLabel ?? `Join ${clubName ?? ""}`;

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
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "16px",
            zIndex: 2,
          }}
        >
          <CloseButton onClick={onClose} />
        </div>

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
                    fontSize: "30px",
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
                  color="#EECF01"
                  textColor="#000000"
                  width={310}
                  fontSize={30}
                  fontFamily="var(--font-dm-serif-text)"
                  fontWeight={700}
                />
              </div>

              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  padding: "16px",
                  width: "100%",
                }}
              >
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
                  You and your friends, writing whatever you want, sharing once
                  a month, purely for fun. A write club gives your friend group
                  a shared purpose, some light structure, and total creative
                  freedom.
                </p>
              </div>

              <SecondaryButton
                onClick={onJoin}
                disabled={isJoining}
                loading={isJoining}
              >
                {resolvedCtaLabel}
              </SecondaryButton>

              <div style={{ backgroundColor: "#FFFFFF", padding: "4px 16px" }}>
                <button
                  onClick={() => setStep(2)}
                  style={{
                    background: "none",
                    border: "none",
                    fontFamily: "var(--font-dm-sans)",
                    fontSize: "14px",
                    fontWeight: 300,
                    color: "#666666",
                    cursor: "pointer",
                    padding: 0,
                    textDecoration: "underline",
                    textDecorationColor: "#666666",
                  }}
                >
                  Cool, but what&apos;s a riff?
                </button>
              </div>
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
                    fontSize: "30px",
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
                  color="#FF6B35"
                  textColor="#000000"
                  width={285}
                  fontSize={30}
                  fontFamily="var(--font-dm-serif-text)"
                  fontWeight={700}
                />
              </div>

              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  padding: "16px",
                  width: "100%",
                }}
              >
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
                  Riffs give a rhythm to the club. Write solo, on your own time.
                  Reveal together, on a set date that works for everyone. Keep
                  the riff going in the comments section. Then run it back
                  again.
                </p>
              </div>

              <SecondaryButton
                onClick={onJoin}
                disabled={isJoining}
                loading={isJoining}
              >
                {resolvedCtaLabel}
              </SecondaryButton>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
