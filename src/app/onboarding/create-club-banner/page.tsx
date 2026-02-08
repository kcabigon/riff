"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import OnboardingCard from "@/components/onboarding/OnboardingCard";
import ImageUpload from "@/components/onboarding/ImageUpload";
import PrimaryButton from "@/components/PrimaryButton";
import BackButton from "@/components/BackButton";
import Tagline from "@/components/Tagline";

export const dynamic = "force-dynamic";

interface PendingClubData {
  name: string;
  description: string | null;
}

export default function OnboardingCreateClubBannerPage() {
  const router = useRouter();
  const [bannerImage, setBannerImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clubData, setClubData] = useState<PendingClubData | null>(null);

  // Load club data from sessionStorage
  useEffect(() => {
    const pendingClubData = sessionStorage.getItem("pendingClub");
    if (!pendingClubData) {
      // No pending club data, redirect back to create-club
      router.push("/onboarding/create-club");
      return;
    }

    try {
      const data = JSON.parse(pendingClubData) as PendingClubData;
      setClubData(data);
    } catch (err) {
      console.error("Error parsing pending club data:", err);
      router.push("/onboarding/create-club");
    }
  }, [router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!clubData) {
      setError("Club data is missing. Please start over.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: clubData.name,
          description: clubData.description,
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

      // Clear pending club data
      sessionStorage.removeItem("pendingClub");

      // Success - redirect to invite step
      router.push(`/onboarding/invite?clubId=${clubId}`);
    } catch (err: any) {
      console.error("Error creating club:", err);
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  // Show nothing while loading club data
  if (!clubData) {
    return null;
  }

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
        <div style={{ width: "100%", display: "flex", alignItems: "flex-start" }}>
          <BackButton href="/onboarding/create-club" />
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
          {/* Banner Upload Field */}
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              alignItems: "flex-start",
            }}
          >
            <Tagline text="Let's make it your own (optional)" color="#01EFFC" width={218} />
            <ImageUpload
              onUpload={setBannerImage}
              currentImage={bannerImage}
              disabled={loading}
              uploadIcon={
                <Image
                  src="/icons/camera_icon.svg"
                  alt=""
                  width={56}
                  height={42}
                />
              }
              uploadText="Upload your club's cover photo"
              hideRecommendedText={true}
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

          {/* Submit Button */}
          <PrimaryButton
            type="submit"
            loading={loading}
            disabled={loading}
            style={{ backgroundColor: "#EECF01" }}
          >
            Cool. What's next?
          </PrimaryButton>
        </form>
      </div>
    </OnboardingCard>
  );
}
