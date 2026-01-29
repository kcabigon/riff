"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import OnboardingCard from "@/components/onboarding/OnboardingCard";
import OnboardingInput from "@/components/onboarding/OnboardingInput";
import OnboardingTextarea from "@/components/onboarding/OnboardingTextarea";
import OnboardingButton from "@/components/onboarding/OnboardingButton";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import ImageUpload from "@/components/onboarding/ImageUpload";

export default function OnboardingCreateClubPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [clubName, setClubName] = useState("");
  const [description, setDescription] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Generate default club name from user's first name
  useEffect(() => {
    if (session?.user) {
      const firstName = (session.user as any).firstName || "My";
      setClubName(`${firstName}'s write club`);
    }
  }, [session]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Use default name if not changed
    const finalClubName = clubName.trim() || `${(session?.user as any)?.firstName || "My"}'s write club`;

    try {
      const response = await fetch("/api/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: finalClubName,
          description: description.trim() || null,
          bannerImage: bannerImage || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create club");
      }

      const data = await response.json();
      const clubId = data.club.id;

      // Update onboarding step to INVITE
      await fetch("/api/onboarding/complete", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: "INVITE",
          clubId: clubId,
        }),
      });

      // Success - redirect to invite step
      router.push(`/onboarding/invite?clubId=${clubId}`);
    } catch (err: any) {
      console.error("Error creating club:", err);
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <OnboardingCard showLogo={false}>
      <OnboardingProgress currentStep={3} totalSteps={4} />

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
          Create your write club
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
          Give your club a name and personality. You can always change this
          later.
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
          name="clubName"
          placeholder={`${(session?.user as any)?.firstName || "My"}'s write club`}
          value={clubName}
          onChange={(e) => setClubName(e.target.value)}
          disabled={loading}
          autoFocus
        />

        <OnboardingTextarea
          name="description"
          placeholder="A little blurb about this club."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
        />

        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <label
            style={{
              fontFamily: "var(--font-dm-sans)",
              fontSize: "14px",
              fontWeight: 300,
              color: "#000000",
            }}
          >
            Club banner (optional)
          </label>
          <ImageUpload
            onUpload={setBannerImage}
            currentImage={bannerImage}
            disabled={loading}
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

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <OnboardingButton type="submit" loading={loading} disabled={loading}>
            Create club
          </OnboardingButton>

          <OnboardingButton
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            disabled={loading}
          >
            Back
          </OnboardingButton>
        </div>
      </form>
    </OnboardingCard>
  );
}
