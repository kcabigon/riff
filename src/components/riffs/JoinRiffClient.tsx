"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion";
import LandingNavBar from "@/components/LandingNavBar";
import NavBar from "@/components/clubs/NavBar";
import TextInput from "@/components/TextInput";
import PrimaryButton from "@/components/PrimaryButton";
import Avatar from "@/components/shared/Avatar";
import NoiseBackground from "@/components/NoiseBackground";
import Tagline from "@/components/Tagline";
import { getRiffDisplayTitle } from "@/lib/riff-utils";

// Ported from LandingClientPage's hero — same brush-reveal ease, same
// rise-and-fade word treatment, so this line matches the landing page exactly.
const BRUSH_EASE: [number, number, number, number] = [0.4, 0, 0.1, 1];

function TextWord({
  children,
  delay,
  dur,
}: {
  children: React.ReactNode;
  delay: number;
  dur: number;
}) {
  return (
    <motion.span
      className="jrhero-text-word"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: dur, delay, ease: "easeOut" }}
    >
      {children}
    </motion.span>
  );
}

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
  const reducedMotion = useReducedMotion();
  const heroRef = useRef<HTMLDivElement | null>(null);
  const [riffRevealed, setRiffRevealed] = useState(false);

  // Mouse parallax — normalized cursor position [-1, 1] across the hero.
  // Same spring config as the landing page's hero.
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 60, damping: 18, mass: 0.6 });
  const smoothY = useSpring(mouseY, { stiffness: 60, damping: 18, mass: 0.6 });
  const par = reducedMotion ? 4 : 18;
  const riffX = useTransform(smoothX, [-1, 1], [-par, par]);
  const riffY = useTransform(smoothY, [-1, 1], [-par * 0.55, par * 0.55]);

  // Desktop-only, gated on "real mouse present" — same as the landing page.
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    let cleanupListener: (() => void) | null = null;

    const attach = () => {
      const handle = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        mouseX.set(Math.max(-1, Math.min(1, x)));
        mouseY.set(Math.max(-1, Math.min(1, y)));
      };
      window.addEventListener("mousemove", handle);
      cleanupListener = () => window.removeEventListener("mousemove", handle);
    };

    const detach = () => {
      cleanupListener?.();
      cleanupListener = null;
      mouseX.set(0);
      mouseY.set(0);
    };

    if (mq.matches) attach();
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) attach();
      else detach();
    };
    mq.addEventListener("change", onChange);

    return () => {
      mq.removeEventListener("change", onChange);
      detach();
    };
  }, [mouseX, mouseY]);

  const amp = reducedMotion ? 0.25 : 1;
  const idleRiff = {
    rotate: [0, 1.5 * amp, 0, -1.5 * amp, 0],
    y: [0, -6 * amp, 0, 6 * amp, 0],
  };
  const idleLoopRiff = {
    duration: reducedMotion ? 9 : 5.5,
    repeat: Infinity,
    ease: "easeInOut" as const,
    delay: 1.4,
  };
  const HERO_SEQ = reducedMotion
    ? {
        riff: { delay: 0.1, dur: 0.5 },
        withFriends: { delay: 0.55, dur: 0.35 },
      }
    : {
        riff: { delay: 0.15, dur: 0.95 },
        withFriends: { delay: 0.95, dur: 0.55 },
      };

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
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: "100vh",
        backgroundColor: "#FFFFFF",
      }}
    >
      <NoiseBackground fillMode="cover" />
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
        ref={heroRef}
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

          {/* Ported from the landing page hero, line 1 only ("Riff with
              friends.") — same brush-reveal art, offsets, and idle drift. */}
          <div className="jrhero-frame" style={{ margin: "20px 0 0 0" }}>
            <h1 className="jrhero-line">
              <motion.span
                className="jrhero-word-riff"
                style={{ x: riffX, y: riffY }}
              >
                Riff
                <motion.div
                  className="jrhero-word-svg-wrap"
                  initial={{ clipPath: "inset(0 100% 0 0)" }}
                  animate={{ clipPath: "inset(0 0% 0 0)" }}
                  transition={{
                    duration: HERO_SEQ.riff.dur,
                    ease: BRUSH_EASE,
                    delay: HERO_SEQ.riff.delay,
                  }}
                  onAnimationComplete={() => setRiffRevealed(true)}
                  data-revealed={riffRevealed || undefined}
                >
                  <motion.div animate={idleRiff} transition={idleLoopRiff}>
                    <Image
                      src="/images/landing/riff_lp.webp"
                      alt=""
                      width={612}
                      height={520}
                      priority
                      className="jrhero-word-svg"
                    />
                  </motion.div>
                </motion.div>
              </motion.span>{" "}
              <TextWord
                delay={HERO_SEQ.withFriends.delay}
                dur={HERO_SEQ.withFriends.dur}
              >
                with
              </TextWord>{" "}
              <TextWord
                delay={HERO_SEQ.withFriends.delay}
                dur={HERO_SEQ.withFriends.dur}
              >
                friends.
              </TextWord>
            </h1>
          </div>

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
              <Avatar user={riff.creator} size={56} />
              <div
                style={{ display: "flex", flexDirection: "column", gap: "2px" }}
              >
                <p style={cardLabelStyle}>Hosted by</p>
                <p style={cardValueStyle}>
                  {riff.creator.name || "a Riff writer"}
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
                      autoFocus
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
        /* Ported from LandingClientPage's hero CSS — the transparent-text +
           absolutely-positioned brush-art overlay technique, scoped to just
           the "Riff" word since this page only needs line 1. */
        .jrhero-word-riff {
          position: relative;
          display: inline-block;
          color: transparent;
          z-index: -1;
        }
        .jrhero-text-word {
          display: inline-block;
        }
        .jrhero-word-svg-wrap {
          position: absolute;
          height: auto;
          pointer-events: none;
          user-select: none;
          overflow: visible;
          z-index: -1;
          will-change: transform, clip-path;
          top: 24px;
          left: -445px;
          width: 612px;
        }
        .jrhero-word-svg-wrap[data-revealed] {
          clip-path: none !important;
          will-change: auto;
        }
        .jrhero-word-svg {
          display: block;
          width: 100%;
          height: auto;
        }
        .jrhero-frame {
          position: relative;
          width: 898px;
          max-width: 100%;
          /* The brush art is absolutely positioned and doesn't contribute to
             flow height on its own — reserve room for its full bleed (top
             offset + rendered height) so .join-hero's overflow:hidden
             doesn't truncate it, and so the noise background (which sizes
             to .join-hero) covers the whole thing too. */
          height: 640px;
        }
        .jrhero-line {
          margin: 0;
          font-family: var(--font-dm-serif-text);
          font-size: 96px;
          line-height: 132px;
          font-weight: 400;
          color: #000000;
          text-align: left;
        }
        .jrhero-card {
          margin-top: -460px;
        }
        @media (max-width: 767px) {
          .join-hero {
            padding: 48px 24px 64px !important;
          }
          .jrhero-frame {
            height: 480px;
          }
          .jrhero-line {
            font-size: clamp(56px, 18vw, 72px);
            line-height: 1.375;
            text-align: center;
          }
          .jrhero-word-svg-wrap {
            top: 16px;
            left: -342px;
            width: 463px;
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
