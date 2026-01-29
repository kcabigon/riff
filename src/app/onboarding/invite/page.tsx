"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import OnboardingCard from "@/components/onboarding/OnboardingCard";
import OnboardingButton from "@/components/onboarding/OnboardingButton";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";

function InvitePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clubId = searchParams.get("clubId");

  const handleComplete = async () => {
    try {
      // Mark onboarding as completed
      await fetch("/api/onboarding/complete", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "COMPLETED",
          clubId: clubId,
        }),
      });

      // Redirect to the newly created club
      if (clubId) {
        router.push(`/clubs/${clubId}`);
      } else {
        router.push("/clubs");
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
      // Still redirect even if there's an error
      router.push(clubId ? `/clubs/${clubId}` : "/clubs");
    }
  };

  useEffect(() => {
    // If no clubId, something went wrong - redirect to club choice
    if (!clubId) {
      router.push("/onboarding/club-choice");
    }
  }, [clubId, router]);

  return (
    <OnboardingCard>
      <OnboardingProgress currentStep={4} totalSteps={4} />

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
          Invite your friends
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
          Your club is ready! You can invite friends now or skip this step and
          invite them later from your club page.
        </p>
      </div>

      {/* Placeholder for invite options - will be implemented in Branch 4 */}
      <div
        style={{
          width: "100%",
          padding: "32px 24px",
          backgroundColor: "#F9F9F9",
          border: "2px dashed #E6E6E6",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            fontWeight: 300,
            color: "#959595",
            margin: 0,
            textAlign: "center",
          }}
        >
          Invitation features coming soon!
        </p>
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: "14px",
            fontWeight: 300,
            color: "#959595",
            margin: 0,
            textAlign: "center",
          }}
        >
          (Email invites, shareable links, and SMS sharing)
        </p>
      </div>

      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <OnboardingButton onClick={handleComplete}>
          Skip for now
        </OnboardingButton>
      </div>
    </OnboardingCard>
  );
}

export default function OnboardingInvitePage() {
  return (
    <Suspense
      fallback={
        <OnboardingCard>
          <OnboardingProgress currentStep={4} totalSteps={4} />
          <div
            style={{
              width: "100%",
              padding: "32px",
              textAlign: "center",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              color: "#959595",
            }}
          >
            Loading...
          </div>
        </OnboardingCard>
      }
    >
      <InvitePageContent />
    </Suspense>
  );
}
