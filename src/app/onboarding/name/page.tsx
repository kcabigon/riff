"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import OnboardingCard from "@/components/onboarding/OnboardingCard";
import TextInput from "@/components/TextInput";
import PrimaryButton from "@/components/PrimaryButton";
import Tagline from "@/components/Tagline";
// import OnboardingProgress from "@/components/onboarding/OnboardingProgress";

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
    <OnboardingCard
      headerContent={<Tagline text="Let's start with the basics." />}
    >
      {/* <OnboardingProgress currentStep={1} totalSteps={4} /> */}

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
              color: "#DC2626",
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
