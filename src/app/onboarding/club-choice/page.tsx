"use client";

import { useRouter } from "next/navigation";
import OnboardingCard from "@/components/onboarding/OnboardingCard";
import WelcomeNote from "@/components/WelcomeNote";
import PrimaryButton from "@/components/PrimaryButton";
import SecondaryButton from "@/components/SecondaryButton";
// import OnboardingProgress from "@/components/onboarding/OnboardingProgress";

export default function OnboardingClubChoicePage() {
  const router = useRouter();

  // TODO: Build "join a write club" flow
  return (
    <OnboardingCard>
      {/* <OnboardingProgress currentStep={2} totalSteps={4} /> */}

      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        <WelcomeNote>
          <p style={{ margin: 0, marginBottom: "1em" }}>Welcome to Riff!</p>
          <p style={{ margin: 0, marginBottom: "1em" }}>
            We exist to help people foster deeper friendships through write
            clubs - like book clubs but instead of getting together monthly to
            discuss a book, you're connecting over stories written by each
            other.
          </p>
          <p style={{ margin: 0 }}>We think you'll like it here.</p>
        </WelcomeNote>

        <PrimaryButton onClick={() => router.push("/onboarding/create-club")}>
          Start a write club
        </PrimaryButton>

        <SecondaryButton onClick={() => router.push("/onboarding/join-club")}>
          Join a write club
        </SecondaryButton>
      </div>
    </OnboardingCard>
  );
}
