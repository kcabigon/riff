"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import OnboardingCard from "@/components/onboarding/OnboardingCard";
import OnboardingButton from "@/components/onboarding/OnboardingButton";
import BackButton from "@/components/BackButton";
import Tagline from "@/components/Tagline";
import InviteOptions from "@/components/clubs/InviteOptions";

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
    <OnboardingCard showLogo={false}>
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "32px",
        }}
      >
        <BackButton href="/onboarding/create-club-banner" />

        <Tagline
          text="Invite some homies to write with"
          color="#01EFFC"
          textColor="#000000"
          width={330}
        />

        {/* Invite Options Component */}
        {clubId && (
          <InviteOptions
            clubId={clubId}
            inviteUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/clubs/${clubId}/join`}
          />
        )}

        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <OnboardingButton onClick={handleComplete}>
            Skip for now
          </OnboardingButton>
        </div>
      </div>
    </OnboardingCard>
  );
}

export default function OnboardingInvitePage() {
  return (
    <Suspense
      fallback={
        <OnboardingCard>
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
