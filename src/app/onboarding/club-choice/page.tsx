"use client";

import { useRouter } from "next/navigation";
import OnboardingCard from "@/components/onboarding/OnboardingCard";
import OnboardingButton from "@/components/onboarding/OnboardingButton";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";

export default function OnboardingClubChoicePage() {
  const router = useRouter();

  return (
    <OnboardingCard>
      <OnboardingProgress currentStep={2} totalSteps={4} />

      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          alignItems: "center",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "32px",
            fontWeight: 300,
            color: "#000000",
            margin: 0,
            textAlign: "center",
          }}
        >
          Ready to write?
        </h1>
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "16px",
            fontWeight: 300,
            color: "#959595",
            margin: 0,
            textAlign: "center",
            maxWidth: "400px",
          }}
        >
          You can start your own write club or join one created by a friend.
        </p>
      </div>

      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <OnboardingButton
          variant="primary"
          onClick={() => router.push("/onboarding/create-club")}
        >
          Start a write club
        </OnboardingButton>

        <div
          style={{
            position: "relative",
            opacity: 0.5,
            cursor: "not-allowed",
          }}
        >
          <OnboardingButton variant="secondary" disabled>
            Join a write club
          </OnboardingButton>
          <div
            style={{
              position: "absolute",
              top: "-32px",
              right: "8px",
              padding: "4px 12px",
              backgroundColor: "#FFFFFF",
              border: "2px solid #000000",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "12px",
              fontWeight: 300,
              color: "#000000",
            }}
          >
            Coming soon
          </div>
        </div>
      </div>
    </OnboardingCard>
  );
}
