"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import LandingNavBar from "@/components/LandingNavBar";
import NavBar from "@/components/clubs/NavBar";
import TextInput from "@/components/TextInput";
import SecondaryButton from "@/components/SecondaryButton";
import Avatar from "@/components/shared/Avatar";
import { getRiffDisplayTitle, formatDateLong } from "@/lib/riff-utils";

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
    <div style={{ minHeight: "100vh", backgroundColor: "#FFFFFF" }}>
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

      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: "64px 24px 64px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* Riff name — the hero */}
        <h1
          style={{
            fontFamily: "var(--font-dm-serif-text)",
            fontStyle: "italic",
            fontSize: "44px",
            fontWeight: 400,
            color: "#000000",
            margin: "0 0 16px 0",
            lineHeight: 1.1,
          }}
        >
          {displayTitle}
        </h1>

        {/* Hosted by — byline, secondary to the title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "24px",
          }}
        >
          <Avatar user={riff.creator} size={56} />
          <p style={statStyle}>
            Hosted by{" "}
            <span style={{ fontWeight: 700 }}>
              {riff.creator.name || "a Riff writer"}
            </span>
          </p>
        </div>

        {/* Riff details */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            marginBottom: "32px",
          }}
        >
          {riff.deadline && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  flexShrink: 0,
                  backgroundColor: "#FFFFFF",
                  border: "2px solid #000000",
                  boxShadow: "2px 2px 0px 0px #000000",
                  overflow: "hidden",
                }}
              >
                <div style={{ height: "8px", backgroundColor: "#DC2626" }} />
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
                  alignItems: "flex-start",
                  gap: "2px",
                }}
              >
                <p style={{ ...statStyle, textAlign: "left" }}>Deadline</p>
                <p style={{ ...statStyle, textAlign: "left", fontWeight: 700 }}>
                  {formatDateLong(riff.deadline)}
                </p>
              </div>
            </div>
          )}

          {riff.prompt && (
            <p
              style={{
                fontFamily: "var(--font-over-the-rainbow)",
                fontSize: "24px",
                fontWeight: 400,
                color: "#000000",
                margin: "24px 0 0 0",
                lineHeight: "1.4",
                maxWidth: "500px",
              }}
            >
              {riff.prompt}
            </p>
          )}
        </div>

        {/* CTA area — changes based on riff availability / auth / onboarding state */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
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
              <p style={ctaTextStyle}>
                You&apos;ve been invited to write along with this riff.
              </p>
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
                  autoFocus
                  autoComplete="email"
                />
                <SecondaryButton type="submit" loading={loading}>
                  Join riff
                </SecondaryButton>
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
                We sent a magic link to <strong>{email}</strong>. Click it to
                continue joining {displayTitle}.
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
                {error && <p style={errorStyle}>{error}</p>}
                <SecondaryButton type="submit" loading={loading}>
                  Join riff
                </SecondaryButton>
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
              <p style={ctaTextStyle}>
                You&apos;ve been invited to write along with this riff.
              </p>
              {error && <p style={errorStyle}>{error}</p>}
              <SecondaryButton loading={loading} onClick={handleJoin}>
                Join riff
              </SecondaryButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const statStyle: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans)",
  fontSize: "16px",
  fontWeight: 300,
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
