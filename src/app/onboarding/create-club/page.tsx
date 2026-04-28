"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import OnboardingCard from "@/components/onboarding/OnboardingCard";
import TextInput from "@/components/TextInput";
import Tagline from "@/components/Tagline";
import BackButton from "@/components/BackButton";

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

    const finalClubName = clubName.trim() || "My Write Club";

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
              const fromSameApp =
                document.referrer &&
                new URL(document.referrer).origin === window.location.origin;
              if (fromSameApp) {
                router.back();
              } else {
                router.push("/onboarding/club-choice");
              }
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
            <Tagline text="Club name" color="#C01582" width={118} />
            <TextInput
              type="text"
              name="clubName"
              placeholder="Dead Poets Society"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              disabled={loading}
              autoFocus
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
            <Tagline text="Description" color="#955CB5" width={125} />
            <TextInput
              multiline
              rows={3}
              name="description"
              placeholder="We don't read and write poetry because it's cute. We read and write poetry because we are members of the human race."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
            <div style={{ backgroundColor: "#FFFFFF", padding: "4px 8px" }}>
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "13px",
                  fontWeight: 300,
                  color: "#959595",
                  margin: 0,
                }}
              >
                Chill out, you can change both of these later if you want.
              </p>
            </div>
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
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: "45px",
              backgroundColor: loading ? "#FFFFFF" : "#EECF01",
              border: loading ? "2px solid #9C9C9C" : "2px solid #000000",
              boxShadow: loading ? "none" : "8px 8px 0px 0px #000000",
              padding: "12px 48px",
              fontFamily: "var(--font-dm-sans)",
              fontSize: "16px",
              fontWeight: 300,
              lineHeight: "normal",
              color: loading ? "#9C9C9C" : "#000000",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxSizing: "border-box",
            }}
          >
            {loading ? "Loading..." : "Now what?"}
          </button>
        </form>
      </div>
    </OnboardingCard>
  );
}
