"use client";

import { useRouter } from "next/navigation";
import OnboardingCard from "@/components/onboarding/OnboardingCard";
import PrimaryButton from "@/components/PrimaryButton";

export default function NoClubPage() {
  const router = useRouter();

  return (
    <OnboardingCard>
      <div
        style={{
          width: "100%",
          backgroundColor: "#FFFFFF",
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "24px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-dm-serif-text)",
            fontSize: "32px",
            fontWeight: 400,
            color: "#000000",
            margin: 0,
            textAlign: "center",
          }}
        >
          As if. You&apos;re totally clubless.
        </p>

        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#000000",
            margin: 0,
            lineHeight: "1.6",
            textAlign: "center",
          }}
        >
          Start a write club and rally your crew, or ask a host to send you an
          invite link.
        </p>

        <PrimaryButton onClick={() => router.push("/onboarding/create-club")}>
          Start a write club
        </PrimaryButton>

        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            fontWeight: 300,
            color: "#666666",
            margin: 0,
            lineHeight: "1.5",
            textAlign: "center",
          }}
        >
          Want to join an existing write club? Have the club host send you an
          invite link to join.
        </p>
      </div>
    </OnboardingCard>
  );
}
