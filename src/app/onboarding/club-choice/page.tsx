"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingCard from "@/components/onboarding/OnboardingCard";
import PrimaryButton from "@/components/PrimaryButton";
import CTAButton from "@/components/CTAButton";
import Tagline from "@/components/Tagline";

export default function OnboardingClubChoicePage() {
  const router = useRouter();
  const [joinClicked, setJoinClicked] = useState(false);
  const [writeClubAnswered, setWriteClubAnswered] = useState(false);

  return (
    <OnboardingCard
      headerContent={
        <Tagline text="Every write club needs a host" width={320} />
      }
    >
      {/* CTAs */}
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <PrimaryButton
          onClick={() => {
            sessionStorage.setItem(
              "pendingClubFrom",
              "/onboarding/club-choice"
            );
            router.push("/onboarding/create-club");
          }}
        >
          Start a write club
        </PrimaryButton>

        {joinClicked ? (
          <div
            style={{
              width: "100%",
              border: "2px solid #9C9C9C",
              padding: "12px 48px",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              fontWeight: 300,
              color: "#9C9C9C",
              backgroundColor: "#FFFFFF",
              boxSizing: "border-box",
              textAlign: "center",
              lineHeight: "1.5",
            }}
          >
            Have the host send you an invitation link.{" "}
            <button
              onClick={() => router.push("/no-club")}
              style={{
                background: "none",
                border: "none",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "14px",
                fontWeight: 300,
                color: "#9C9C9C",
                cursor: "pointer",
                padding: 0,
                textDecoration: "underline",
                textDecorationColor: "#9C9C9C",
              }}
            >
              Get started with no club.
            </button>
          </div>
        ) : (
          <CTAButton
            onClick={() => setJoinClicked(true)}
            accentColor="#01EFFC"
            style={{ width: "100%" }}
          >
            Join a friend&apos;s club
          </CTAButton>
        )}
      </div>

      {/* Soft toggle */}
      <div style={{ textAlign: "center" }}>
        {writeClubAnswered ? (
          <span
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "13px",
              fontWeight: 300,
              color: "#808080",
              backgroundColor: "#FFFFFF",
              padding: "4px 8px",
            }}
          >
            Like a book club but for writing.
          </span>
        ) : (
          <button
            onClick={() => setWriteClubAnswered(true)}
            style={{
              backgroundColor: "#FFFFFF",
              border: "none",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "13px",
              fontWeight: 300,
              color: "#808080",
              cursor: "pointer",
              padding: "4px 8px",
              textDecoration: "underline",
              textDecorationColor: "#808080",
            }}
          >
            Wait, what&apos;s a write club?
          </button>
        )}
      </div>
    </OnboardingCard>
  );
}
