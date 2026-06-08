"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CTAButton from "@/components/CTAButton";
import CloseButton from "@/components/CloseButton";
import { TUTORIAL_RIFF, getTutorialDates } from "@/lib/tutorial";

interface SampleRiffCardProps {
  clubId?: string;
  onDismiss?: () => void;
}

export default function SampleRiffCard({
  clubId,
  onDismiss,
}: SampleRiffCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [tutorialUrl, setTutorialUrl] = useState(
    clubId ? `/tutorial/riff?clubId=${clubId}` : "/tutorial/riff"
  );
  const { deadline } = getTutorialDates();

  useEffect(() => {
    const savedStep = sessionStorage.getItem("tutorial-step");
    if (savedStep) {
      setTutorialUrl(
        clubId
          ? `/tutorial/riff?step=${savedStep}&clubId=${clubId}`
          : `/tutorial/riff?step=${savedStep}`
      );
    }
  }, [clubId]);

  const handleStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(tutorialUrl);
  };

  return (
    <div
      onClick={() => router.push(tutorialUrl)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="sample-riff-card"
      style={{
        position: "relative",
        backgroundColor: "#FFFFFF",
        border: "2px solid #000000",
        padding: "32px",
        display: "flex",
        gap: "40px",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer",
        boxShadow: isHovered
          ? "8px 8px 0px 0px #955CB5"
          : "8px 8px 0px 0px #000000",
        transition: "box-shadow 0.1s ease",
        marginBottom: "16px",
      }}
    >
      {onDismiss && (
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            zIndex: 2,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <CloseButton size={24} onClick={onDismiss} />
        </div>
      )}

      {/* Left — metadata */}
      <div
        className="sample-riff-card-meta"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          flex: 1,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <h3
            style={{
              fontFamily: "var(--font-dm-serif-text)",
              fontSize: "24px",
              fontWeight: 400,
              color: "#000000",
              margin: 0,
              lineHeight: "normal",
            }}
          >
            {TUTORIAL_RIFF.title}
          </h3>

          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              color: "#808080",
              margin: 0,
              lineHeight: "normal",
            }}
          >
            Deadline: {deadline}
          </p>
        </div>

        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#808080",
            margin: 0,
            lineHeight: "1.4",
          }}
        >
          Click Join riff to start this tutorial
        </p>
      </div>

      {/* Right — CTA */}
      <div
        className="sample-riff-card-cta"
        style={{
          minWidth: "200px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
        }}
      >
        <CTAButton onClick={handleStart} accentColor="#955CB5">
          Join riff
        </CTAButton>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .sample-riff-card {
            flex-direction: column !important;
            gap: 24px !important;
            padding: 24px !important;
          }
          .sample-riff-card-meta {
            width: 100% !important;
          }
          .sample-riff-card-cta {
            min-width: 0 !important;
            width: 100% !important;
          }
          .sample-riff-card-cta button {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
