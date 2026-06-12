"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import OnboardingCard from "@/components/onboarding/OnboardingCard";
import TextInput from "@/components/TextInput";
import Tagline from "@/components/Tagline";
import BackButton from "@/components/BackButton";
import PrimaryButton from "@/components/PrimaryButton";

import { CLUB_NAME_MAX, DESCRIPTION_MAX } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default function OnboardingCreateClubPage() {
  const router = useRouter();
  const [clubName, setClubName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const finalClubName = clubName.trim() || "Write Club";

    // Store club data in sessionStorage for next step
    sessionStorage.setItem(
      "pendingClub",
      JSON.stringify({
        name: finalClubName,
        description: description.trim() || null,
      })
    );

    // Navigate to banner upload step
    router.push("/onboarding/create-club-banner");
  };

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
        {/* Back Button */}
        <div
          style={{ width: "100%", display: "flex", alignItems: "flex-start" }}
        >
          <BackButton
            onClick={() => {
              const from =
                sessionStorage.getItem("pendingClubFrom") ??
                "/onboarding/club-choice";
              sessionStorage.removeItem("pendingClubFrom");
              router.push(from);
            }}
          />
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {/* Club Name Field */}
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <Tagline
              text="Club name"
              color="#C01582"
              width={118}
              textColor="#FFFFFF"
            />
            <TextInput
              type="text"
              name="clubName"
              placeholder="Dead Poets Society"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              disabled={loading}
              autoFocus
              maxLength={CLUB_NAME_MAX}
              error={clubName.length >= CLUB_NAME_MAX ? " " : undefined}
            />
          </div>

          {/* Description Field */}
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <Tagline
              text="Description"
              color="#955CB5"
              width={125}
              textColor="#FFFFFF"
            />
            <TextInput
              multiline
              rows={3}
              name="description"
              placeholder="We don't read and write poetry because it's cute. We read and write poetry because..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              maxLength={DESCRIPTION_MAX}
              error={description.length >= DESCRIPTION_MAX ? " " : undefined}
            />
            <span
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "13px",
                fontWeight: 300,
                color: "#9C9C9C",
                backgroundColor: "#FFFFFF",
                padding: "4px 8px",
                alignSelf: "flex-start",
              }}
            >
              Congrats, your club&apos;s first creative act. Don&apos;t worry,
              you can change these later if you want.
            </span>
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

          {/* Submit Button */}
          <PrimaryButton type="submit" loading={loading} disabled={loading}>
            Cool, what&apos;s next?
          </PrimaryButton>
        </form>
      </div>
    </OnboardingCard>
  );
}
