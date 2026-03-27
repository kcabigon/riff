"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingCard from "@/components/onboarding/OnboardingCard";
import PrimaryButton from "@/components/PrimaryButton";
import ConversionModal from "@/components/clubs/ConversionModal";

export default function OnboardingClubChoicePage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <OnboardingCard>
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* Heading */}
        <p
          style={{
            fontFamily: "var(--font-dm-serif-text)",
            fontSize: "28px",
            fontWeight: 400,
            color: "#000000",
            margin: 0,
          }}
        >
          Every write club needs a host
        </p>

        {/* Body */}
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#000000",
            margin: 0,
            lineHeight: "1.6",
          }}
        >
          Be the one to rally the crew and get the party started. Riff will
          organize and automate the logistics so you can be the hostess with the
          mostest.
        </p>

        <PrimaryButton onClick={() => router.push("/onboarding/create-club")}>
          Start a write club
        </PrimaryButton>

        {/* Join note */}
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            fontWeight: 300,
            color: "#666666",
            margin: 0,
            lineHeight: "1.5",
          }}
        >
          Want to join an existing write club? Have the club host send you an
          invite link to join.
        </p>

        {/* Quiet link — separate afterthought */}
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            background: "none",
            border: "none",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "13px",
            fontWeight: 300,
            color: "#666666",
            cursor: "pointer",
            padding: 0,
            textDecoration: "underline",
            textDecorationColor: "#666666",
            textAlign: "left",
            marginTop: "-8px",
          }}
        >
          Wait, what&apos;s a write club?
        </button>
      </div>

      <ConversionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ctaLabel="Start a write club"
        onJoin={() => router.push("/onboarding/create-club")}
        isJoining={false}
      />
    </OnboardingCard>
  );
}
