"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import OnboardingCard from "@/components/onboarding/OnboardingCard";
import TextInput from "@/components/TextInput";
import PrimaryButton from "@/components/PrimaryButton";
import Tagline from "@/components/Tagline";

function JoinOnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clubId = searchParams.get("clubId");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter both first and last name");
      setLoading(false);
      return;
    }

    try {
      // Save name
      const nameRes = await fetch("/api/onboarding/name", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      });

      if (!nameRes.ok) {
        const data = await nameRes.json();
        throw new Error(data.error || "Failed to save name");
      }

      // Mark onboarding complete (skip club creation)
      await fetch("/api/onboarding/complete", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "COMPLETED" }),
      });

      // Auto-join the club since they already expressed intent
      if (clubId) {
        const joinRes = await fetch(`/api/clubs/${clubId}/join`, {
          method: "POST",
        });
        if (joinRes.ok) {
          router.push(`/clubs/${clubId}`);
        } else {
          // Fall back to join page so they can retry
          router.push(`/clubs/${clubId}/join`);
        }
      } else {
        router.push("/clubs");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <OnboardingCard
      headerContent={
        <Tagline
          text="First, let's get to know you."
          color="#01EFFC"
          textColor="#000000"
          width={330}
        />
      }
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "32px",
        }}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <TextInput
            type="text"
            name="firstName"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={loading}
            required
            autoFocus
          />

          <TextInput
            type="text"
            name="lastName"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        {error && (
          <p
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              fontWeight: 300,
              color: "#FF0000",
              margin: 0,
              textAlign: "center",
            }}
          >
            {error}
          </p>
        )}

        <PrimaryButton type="submit" loading={loading} disabled={loading}>
          Continue
        </PrimaryButton>
      </form>
    </OnboardingCard>
  );
}

export default function OnboardingJoinPage() {
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
      <JoinOnboardingContent />
    </Suspense>
  );
}
