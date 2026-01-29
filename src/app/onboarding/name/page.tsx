"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import OnboardingCard from "@/components/onboarding/OnboardingCard";
import OnboardingInput from "@/components/onboarding/OnboardingInput";
import OnboardingButton from "@/components/onboarding/OnboardingButton";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";

export default function OnboardingNamePage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Basic validation
    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter both first and last name");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/onboarding/name", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save name");
      }

      // Success - redirect to club choice
      router.push("/onboarding/club-choice");
    } catch (err: any) {
      console.error("Error saving name:", err);
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <OnboardingCard>
      <OnboardingProgress currentStep={1} totalSteps={4} />

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
          What's your name?
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
          Let's start with the basics. We'll use this to personalize your
          experience.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        <OnboardingInput
          type="text"
          name="firstName"
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          disabled={loading}
          required
          autoFocus
        />

        <OnboardingInput
          type="text"
          name="lastName"
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          disabled={loading}
          required
        />

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

        <OnboardingButton type="submit" loading={loading} disabled={loading}>
          Continue
        </OnboardingButton>
      </form>
    </OnboardingCard>
  );
}
