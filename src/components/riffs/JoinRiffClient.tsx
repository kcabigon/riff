"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import LandingNavBar from "@/components/LandingNavBar";
import NavBar from "@/components/clubs/NavBar";
import TextInput from "@/components/TextInput";
import PrimaryButton from "@/components/PrimaryButton";
import Avatar from "@/components/shared/Avatar";
import { noiseTileStyle } from "@/components/NoiseBackground";
import Tagline from "@/components/Tagline";
import BrushWordHero from "@/components/shared/BrushWordHero";
import { getRiffDisplayTitle } from "@/lib/riff-utils";

type JoinStep = "email" | "check-email" | "name" | "join";

interface JoinRiffClientProps {
  riff: {
    id: string;
    title: string | null;
    prompt: string | null;
    deadline: string | null;
    status: string;
    volumeNumber?: number | null;
    creator: {
      id: string;
      name: string | null;
      username: string | null;
      avatarUrl: string | null;
    };
  };
  isLoggedIn: boolean;
  hasName: boolean;
  needsOnboarding: boolean;
  user?: {
    id: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
  } | null;
  userClubs?: Array<{ id: string; name: string }>;
  lastActiveClubId?: string | null;
}

export default function JoinRiffClient({
  riff,
  isLoggedIn,
  hasName,
  needsOnboarding,
  user,
  userClubs = [],
  lastActiveClubId,
}: JoinRiffClientProps) {
  const router = useRouter();

  const getInitialStep = (): JoinStep => {
    if (!isLoggedIn) return "email";
    if (!hasName) return "name";
    return "join";
  };

  const [step, setStep] = useState<JoinStep>(getInitialStep);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayTitle = getRiffDisplayTitle(riff);
  const isJoinable = riff.status === "ACTIVE";

  // Step 1: send magic link back to this join page
  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await signIn("resend", {
        email,
        redirect: false,
        callbackUrl: `/riffs/${riff.id}/join`,
      });
      if (result?.error) {
        setError("Failed to send magic link. Please try again.");
        setLoading(false);
      } else {
        setStep("check-email");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  // Step 2 (new user): save name, mark onboarding complete, join riff
  const handleNameSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter both first and last name");
      return;
    }
    setLoading(true);
    setError(null);
    try {
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

      await fetch("/api/onboarding/complete", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "COMPLETED" }),
      });

      const joinRes = await fetch(`/api/riffs/${riff.id}/participants`, {
        method: "POST",
      });
      if (joinRes.ok) {
        router.push(`/riffs/${riff.id}`);
      } else {
        const data = await joinRes.json();
        throw new Error(data.error || "Failed to join riff");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
      setLoading(false);
    }
  };

  // Step 3 (existing user or abandoned onboarding): join riff
  const handleJoin = async () => {
    setLoading(true);
    setError(null);
    try {
      // If they have a name but never finished onboarding, mark it complete now
      if (needsOnboarding) {
        await fetch("/api/onboarding/complete", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ step: "COMPLETED" }),
        });
      }

      const res = await fetch(`/api/riffs/${riff.id}/participants`, {
        method: "POST",
      });
      if (res.ok) {
        router.push(`/riffs/${riff.id}`);
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong. Try again.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  return (
    // Tiled noise, not cover: cover scales one big feTurbulence filter to the
    // whole page, and on a tall page at phone DPR the raster area blows past
    // mobile Safari's filter limit, so Safari silently drops the filter and
    // paints plain white. Tiling rasterizes once at its natural size.
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: "100vh",
        ...noiseTileStyle,
      }}
    >
      {isLoggedIn && user ? (
        <div style={{ position: "sticky", top: 0, zIndex: 50 }}>
          <NavBar
            user={user}
            clubs={userClubs}
            currentClub={
              userClubs.find((c) => c.id === lastActiveClubId) ??
              userClubs[0] ??
              null
            }
            showClubDropdown={userClubs.length > 0}
          />
        </div>
      ) : (
        <LandingNavBar sticky />
      )}

      {/* Hero — full-bleed textured invite framing */}
      <div
        className="join-hero"
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "80px 24px 96px",
        }}
      >
        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: "840px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <Tagline
            text="YOU'RE INVITED TO"
            color="#EECF01"
            textColor="#000000"
            width={260}
            fontSize={13}
            fontWeight={700}
          />

          <BrushWordHero word="riff" className="jrhero-frame" />

          {/* Riff details card — pulled up to overlap the bottom of the
              brush art, which is much taller than the text line it sits on
              (absolutely positioned, so .jrhero-frame's reserved height
              doesn't push the card below it). */}
          <div
            className="jrhero-card"
            style={{
              position: "relative",
              zIndex: 1,
              width: "100%",
              maxWidth: "560px",
              backgroundColor: "#FFFFFF",
              border: "2px solid #000000",
              boxShadow: "8px 8px 0px 0px #000000",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              textAlign: "left",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-dm-serif-text)",
                fontSize: "36px",
                fontWeight: 400,
                color: "#000000",
                margin: 0,
                lineHeight: 1.2,
                textAlign: "center",
              }}
            >
              {displayTitle}
            </h2>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Avatar user={riff.creator} size={64} />
              <div
                style={{ display: "flex", flexDirection: "column", gap: "2px" }}
              >
                <p style={cardLabelStyle}>Hosted by</p>
                <p style={cardValueStyle}>
                  {riff.creator.name || "User with no name"}
                </p>
              </div>
            </div>

            {riff.deadline && (
              <>
                <div style={{ borderTop: "1px solid #E6E6E6" }} />
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div
                    style={{
                      flexShrink: 0,
                      backgroundColor: "#FFFFFF",
                      border: "2px solid #000000",
                      boxShadow: "2px 2px 0px 0px #000000",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{ height: "8px", backgroundColor: "#DC2626" }}
                    />
                    <div
                      style={{
                        padding: "8px 12px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        lineHeight: 1,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-dm-sans)",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#808080",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                      >
                        {new Date(riff.deadline)
                          .toLocaleDateString("en-US", { month: "short" })
                          .toUpperCase()}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-dm-serif-text)",
                          fontSize: "22px",
                          fontWeight: 400,
                          color: "#000000",
                        }}
                      >
                        {new Date(riff.deadline).getDate()}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                    }}
                  >
                    <p style={cardLabelStyle}>Deadline</p>
                    <p
                      style={{
                        fontFamily: "var(--font-dm-sans)",
                        fontSize: "16px",
                        fontWeight: 300,
                        color: "#000000",
                        margin: 0,
                      }}
                    >
                      Write something and submit before this date.
                    </p>
                  </div>
                </div>
              </>
            )}

            {riff.prompt && (
              <>
                <div style={{ borderTop: "1px solid #E6E6E6" }} />
                <p
                  style={{
                    fontFamily: "var(--font-over-the-rainbow)",
                    fontSize: "24px",
                    fontWeight: 400,
                    color: "#000000",
                    margin: 0,
                    lineHeight: "1.4",
                  }}
                >
                  {riff.prompt}
                </p>
              </>
            )}

            <div style={{ borderTop: "1px solid #E6E6E6" }} />

            {/* CTA — changes based on riff availability / auth / onboarding state */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: "16px",
              }}
            >
              {!isJoinable && (
                <p style={ctaTextStyle}>
                  This riff isn&apos;t accepting new writers anymore.
                </p>
              )}

              {isJoinable && step === "email" && (
                <>
                  <p style={ctaTextStyle}>Enter your email to get started.</p>
                  <form
                    onSubmit={handleEmailSubmit}
                    style={{
                      width: "100%",
                      maxWidth: "344px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    <TextInput
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      error={error ?? undefined}
                      disabled={loading}
                      required
                      autoComplete="email"
                    />
                    <PrimaryButton type="submit" loading={loading}>
                      Let's riff
                    </PrimaryButton>
                  </form>
                </>
              )}

              {isJoinable && step === "check-email" && (
                <div
                  style={{
                    maxWidth: "344px",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <p style={ctaTextStyle}>Check your inbox.</p>
                  <p
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "14px",
                      fontWeight: 300,
                      color: "#808080",
                      margin: 0,
                    }}
                  >
                    We sent a magic link to <strong>{email}</strong>. Click it
                    to continue joining {displayTitle}.
                  </p>
                </div>
              )}

              {isJoinable && step === "name" && (
                <>
                  <p style={ctaTextStyle}>First, tell us your name.</p>
                  <form
                    onSubmit={handleNameSubmit}
                    style={{
                      width: "100%",
                      maxWidth: "344px",
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
                    {error && <p style={errorStyle}>{error}</p>}
                    <PrimaryButton type="submit" loading={loading}>
                      Let's riff
                    </PrimaryButton>
                  </form>
                </>
              )}

              {isJoinable && step === "join" && (
                <div
                  style={{
                    width: "100%",
                    maxWidth: "344px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "16px",
                  }}
                >
                  {error && <p style={errorStyle}>{error}</p>}
                  <PrimaryButton loading={loading} onClick={handleJoin}>
                    Let's riff
                  </PrimaryButton>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* Riff word/brush-art treatment lives in BrushWordHero now — this
           page only adds its own spacing around that shared frame. */
        .jrhero-frame {
          margin: 20px 0 0 0;
        }
        .jrhero-card {
          margin-top: -460px;
        }
        @media (max-width: 767px) {
          .join-hero {
            padding: 48px 24px 64px !important;
          }
          .jrhero-card {
            margin-top: -240px;
          }
        }
      `}</style>
    </div>
  );
}

const cardLabelStyle: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans)",
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "#808080",
  margin: 0,
};

const cardValueStyle: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans)",
  fontSize: "16px",
  fontWeight: 700,
  color: "#000000",
  margin: 0,
};

const ctaTextStyle: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans)",
  fontSize: "18px",
  fontWeight: 300,
  color: "#000000",
  margin: 0,
  textAlign: "center",
};

const errorStyle: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans)",
  fontSize: "14px",
  fontWeight: 300,
  color: "#DC2626",
  margin: 0,
  textAlign: "center",
};
