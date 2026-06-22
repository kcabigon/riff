"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import AvatarStack from "@/components/shared/AvatarStack";
import LandingNavBar from "@/components/LandingNavBar";
import NavBar from "@/components/clubs/NavBar";

import { useIsMobile } from "@/hooks/useMediaQuery";
import TextInput from "@/components/TextInput";
import SecondaryButton from "@/components/SecondaryButton";

type JoinStep = "email" | "check-email" | "name" | "join";

interface ClubMember {
  user: {
    id: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
}

interface JoinClubClientProps {
  club: {
    id: string;
    name: string;
    description: string | null;
    bannerImage: string | null;
    members: ClubMember[];
  };
  stats: {
    riffCount: number;
    pieceCount: number;
    wordCount: number;
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

export default function JoinClubClient({
  club,
  stats,
  isLoggedIn,
  hasName,
  needsOnboarding,
  user,
  userClubs = [],
  lastActiveClubId,
}: JoinClubClientProps) {
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
  const [writeClubAnswered, setWriteClubAnswered] = useState(false);
  const isMobile = useIsMobile();

  const formatNumber = (n: number) => n.toLocaleString();

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
        callbackUrl: `/clubs/${club.id}/join`,
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

  // Step 2 (new user): save name, mark onboarding complete, join club
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

      const joinRes = await fetch(`/api/clubs/${club.id}/join`, {
        method: "POST",
      });
      if (joinRes.ok) {
        router.push(`/clubs/${club.id}?welcome=member`);
      } else {
        const data = await joinRes.json();
        throw new Error(data.error || "Failed to join club");
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

  // Step 3 (existing user or abandoned onboarding): join club
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

      const res = await fetch(`/api/clubs/${club.id}/join`, { method: "POST" });
      if (res.ok) {
        router.push(`/clubs/${club.id}?welcome=member`);
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

      {/* Banner — KEEP IN SYNC WITH: ClubPageLayout.tsx (banner header layout, avatar sizes, maxWidth) */}
      {club.bannerImage && (
        <div
          className="club-banner"
          style={{
            width: "100%",
            height: "320px",
            backgroundImage: `url(${club.bannerImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Dark overlay + metadata — desktop only */}
          {!isMobile && (
            <>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundColor: "rgba(0, 0, 0, 0.66)",
                }}
              />
              <div
                style={
                  club.members.length > 9
                    ? {
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                        alignItems: "flex-start",
                        width: "100%",
                        maxWidth: "1000px",
                        padding: "0 24px",
                      }
                    : {
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                        alignItems: "flex-start",
                        maxWidth: "396px",
                      }
                }
              >
                <h1
                  style={{
                    fontFamily: "var(--font-dm-serif-text)",
                    fontSize: "32px",
                    fontWeight: 400,
                    color: "#FFFFFF",
                    margin: 0,
                  }}
                >
                  {club.name}
                </h1>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "4px 12px",
                    alignItems: "start",
                  }}
                >
                  <p style={statStyle("#FFFFFF")}>
                    <span style={{ fontWeight: 700 }}>{stats.riffCount}</span>{" "}
                    riffs
                  </p>
                  <p style={statStyle("#FFFFFF")}>
                    <span style={{ fontWeight: 700 }}>{stats.pieceCount}</span>{" "}
                    pieces
                  </p>
                  <p style={statStyle("#FFFFFF")}>
                    <span style={{ fontWeight: 700 }}>
                      {formatNumber(stats.wordCount)}
                    </span>{" "}
                    words
                  </p>
                </div>

                <AvatarStack
                  users={club.members.map((m) => m.user)}
                  size={48}
                  borderColor="#FFFFFF"
                />

                {club.description && (
                  <p
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "16px",
                      fontWeight: 300,
                      color: "#FFFFFF",
                      margin: 0,
                      lineHeight: "1.4",
                      maxWidth: "600px",
                      display: "-webkit-box",
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {club.description}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Mobile metadata — shown below banner on small screens */}
      {club.bannerImage && isMobile && (
        <div
          style={{
            padding: "24px 24px 0",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-dm-serif-text)",
              fontSize: "32px",
              fontWeight: 400,
              color: "#000000",
              margin: 0,
            }}
          >
            {club.name}
          </h1>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "4px 12px",
              alignItems: "start",
            }}
          >
            <p style={statStyle("#000000")}>
              <span style={{ fontWeight: 700 }}>{stats.riffCount}</span> riffs
            </p>
            <p style={statStyle("#000000")}>
              <span style={{ fontWeight: 700 }}>{stats.pieceCount}</span> pieces
            </p>
            <p style={statStyle("#000000")}>
              <span style={{ fontWeight: 700 }}>
                {formatNumber(stats.wordCount)}
              </span>{" "}
              words
            </p>
          </div>

          <AvatarStack
            users={club.members.map((m) => m.user)}
            size={40}
            style={{ overflowX: "auto" }}
          />

          {club.description && (
            <p
              style={{
                fontFamily: "var(--font-dm-sans)",
                fontSize: "16px",
                fontWeight: 300,
                color: "#000000",
                margin: 0,
                lineHeight: "1.4",
              }}
            >
              {club.description}
            </p>
          )}
        </div>
      )}

      {/* Main content */}
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "64px 24px 64px",
        }}
      >
        {/* No-banner header */}
        {!club.bannerImage && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              marginBottom: "48px",
            }}
          >
            <h1
              style={{
                fontFamily: "var(--font-dm-serif-text)",
                fontSize: "32px",
                fontWeight: 400,
                color: "#000000",
                margin: 0,
              }}
            >
              {club.name}
            </h1>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "4px 12px",
                alignItems: "start",
              }}
            >
              <p style={statStyle("#000000")}>
                <span style={{ fontWeight: 700 }}>{stats.riffCount}</span> riffs
              </p>
              <p style={statStyle("#000000")}>
                <span style={{ fontWeight: 700 }}>{stats.pieceCount}</span>{" "}
                pieces
              </p>
              <p style={statStyle("#000000")}>
                <span style={{ fontWeight: 700 }}>
                  {formatNumber(stats.wordCount)}
                </span>{" "}
                words
              </p>
            </div>

            <AvatarStack
              users={club.members.map((m) => m.user)}
              size={isMobile ? 40 : 48}
              style={isMobile ? { overflowX: "auto" } : undefined}
            />

            {club.description && (
              <p
                style={{
                  fontFamily: "var(--font-dm-sans)",
                  fontSize: "16px",
                  fontWeight: 300,
                  color: "#000000",
                  margin: 0,
                  lineHeight: "normal",
                  maxWidth: "600px",
                }}
              >
                {club.description}
              </p>
            )}
          </div>
        )}

        {/* CTA area — changes based on auth/onboarding state */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          {/* Email step: not logged in */}
          {step === "email" && (
            <>
              <p style={ctaTextStyle}>
                You&apos;ve been invited to join this write club.
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
                  Join club
                </SecondaryButton>
              </form>
              {writeClubAnswered ? (
                <span
                  style={{
                    ...whatIsItStyle,
                    cursor: "default",
                    textDecoration: "none",
                  }}
                >
                  Like a book club but for writing.
                </span>
              ) : (
                <button
                  onClick={() => setWriteClubAnswered(true)}
                  style={whatIsItStyle}
                >
                  Wait, what&apos;s a write club?
                </button>
              )}
            </>
          )}

          {/* Check-email step: magic link sent */}
          {step === "check-email" && (
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
                continue joining {club.name}.
              </p>
            </div>
          )}

          {/* Name step: logged in but no name yet */}
          {step === "name" && (
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
                  Join club
                </SecondaryButton>
              </form>
            </>
          )}

          {/* Join step: logged in with name */}
          {step === "join" && (
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
                You&apos;ve been invited to join this write club.
              </p>
              {error && <p style={errorStyle}>{error}</p>}
              <SecondaryButton loading={loading} onClick={handleJoin}>
                Join club
              </SecondaryButton>
              {writeClubAnswered ? (
                <span
                  style={{
                    ...whatIsItStyle,
                    cursor: "default",
                    textDecoration: "none",
                  }}
                >
                  Like a book club but for writing.
                </span>
              ) : (
                <button
                  onClick={() => setWriteClubAnswered(true)}
                  style={whatIsItStyle}
                >
                  Wait, what&apos;s a write club?
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .club-banner {
            height: 200px !important;
          }
        }
      `}</style>
    </div>
  );
}

// Shared button used across multiple steps

const statStyle = (
  color: string,
  fontSize: string = "16px"
): React.CSSProperties => ({
  fontFamily: "var(--font-dm-sans)",
  fontSize,
  fontWeight: 300,
  color,
  margin: 0,
});

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

const whatIsItStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  fontFamily: "var(--font-dm-sans)",
  fontSize: "14px",
  fontWeight: 300,
  color: "#808080",
  cursor: "pointer",
  padding: 0,
  textDecoration: "underline",
  textDecorationColor: "#808080",
  marginTop: "16px",
};
