"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion";
import { noiseTileStyle } from "@/components/NoiseBackground";
import TextInput from "@/components/TextInput";
import Tagline from "@/components/Tagline";
import BackButton from "@/components/BackButton";
import PrimaryButton from "@/components/PrimaryButton";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import ImageUploadFlow from "@/components/shared/ImageUploadFlow";
import type { ImageUploadFlowHandle } from "@/components/shared/ImageUploadFlow";
import CadenceOptionList from "@/components/clubs/CadenceOptionList";
import {
  CREATION_CADENCE_OPTIONS,
  DEFAULT_CADENCE,
  CadenceValue,
  getCadenceDays,
} from "@/lib/cadence";
import { toEndOfDay, toLocalDateInputValue } from "@/lib/riff-utils";

import { CLUB_NAME_MAX, DESCRIPTION_MAX } from "@/lib/constants";

export const dynamic = "force-dynamic";

const TOTAL_STEPS = 3;

// Ported from LandingClientPage's hero — same brush-reveal ease, same
// rise-and-fade word treatment, scoped to just "write club" (mirrors how
// JoinRiffClient ported just "Riff" for the join-riff page).
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
      className="cchero-text-word"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: dur, delay, ease: "easeOut" }}
    >
      {children}
    </motion.span>
  );
}

export default function OnboardingCreateClubPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [clubName, setClubName] = useState("");
  const [description, setDescription] = useState("");
  const [cadence, setCadence] = useState<CadenceValue>(DEFAULT_CADENCE);
  const [bannerImage, setBannerImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const uploadFlowRef = useRef<ImageUploadFlowHandle>(null);
  const reducedMotion = useReducedMotion();
  const heroRef = useRef<HTMLDivElement | null>(null);
  const [writeclubRevealed, setWriteclubRevealed] = useState(false);

  // Mouse parallax — normalized cursor position [-1, 1] across the hero.
  // Same spring config as the landing page's hero; inverted sign vs the
  // "Riff" word on the join-riff page, matching the landing page's own
  // writeclub transform.
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 60, damping: 18, mass: 0.6 });
  const smoothY = useSpring(mouseY, { stiffness: 60, damping: 18, mass: 0.6 });
  const par = reducedMotion ? 4 : 18;
  const writeclubX = useTransform(smoothX, [-1, 1], [par, -par]);
  const writeclubY = useTransform(smoothY, [-1, 1], [par * 0.55, -par * 0.55]);

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
  // Mirrored from the landing page's idleRiff — writeclub drifts the
  // opposite direction so the two words don't move in lockstep.
  const idleWriteclub = {
    rotate: [0, -1.5 * amp, 0, 1.5 * amp, 0],
    y: [0, 6 * amp, 0, -6 * amp, 0],
  };
  const idleLoopWriteclub = {
    duration: reducedMotion ? 10 : 6,
    repeat: Infinity,
    ease: "easeInOut" as const,
    delay: 1.7,
  };
  const HERO_SEQ = reducedMotion
    ? {
        startA: { delay: 0.9, dur: 0.35 },
        writeclub: { delay: 1.2, dur: 0.5 },
        period: { delay: 1.45, dur: 0.3 },
      }
    : {
        startA: { delay: 1.5, dur: 0.55 },
        writeclub: { delay: 1.95, dur: 0.95 },
        period: { delay: 2.45, dur: 0.45 },
      };

  const handleBack = () => {
    if (step > 1) {
      setStep((s) => s - 1);
      return;
    }
    const from = sessionStorage.getItem("pendingClubFrom") ?? "/home";
    sessionStorage.removeItem("pendingClubFrom");
    router.push(from);
  };

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const finalClubName = clubName.trim() || "Write Club";

    // If the user has an unsaved crop, save it first
    let finalBannerImage = bannerImage;
    if (uploadFlowRef.current?.hasPendingCrop()) {
      const url = await uploadFlowRef.current.saveCrop();
      if (!url) {
        // Crop/upload failed — don't submit the form
        setLoading(false);
        return;
      }
      finalBannerImage = url;
    }

    try {
      const response = await fetch("/api/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: finalClubName,
          description: description.trim() || null,
          bannerImage: finalBannerImage || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create club");
      }

      const data = await response.json();
      const clubId = data.club.id;

      // Set as the user's last active club — onboarding is already complete
      // by the time anyone reaches club creation, whether via signup or Home.
      await fetch("/api/onboarding/complete", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId: clubId }),
      });

      // The first riff is real, not mocked — a new club should never land
      // the host on an empty page. Deadline is seeded directly from the
      // chosen cadence's day count (no Cadence field needed for this one-off
      // creation; only the *next* riff after this one needs the schema).
      // Best-effort: club creation itself already succeeded, so a hiccup
      // here shouldn't block the host from reaching their new club. Tried
      // twice — create and activate are two separate requests (not one
      // transaction), so a transient blip between them is the realistic
      // failure mode, and a second attempt covers it cheaply.
      try {
        const cadenceDays = getCadenceDays(cadence);
        if (cadenceDays) {
          const deadlineDate = new Date();
          deadlineDate.setDate(deadlineDate.getDate() + cadenceDays);
          const deadline = toEndOfDay(toLocalDateInputValue(deadlineDate));

          const createAndActivateRiff = async () => {
            const riffResponse = await fetch(`/api/clubs/${clubId}/riffs`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ deadline }),
            });
            if (!riffResponse.ok) return false;

            const { riff } = await riffResponse.json();
            const activateResponse = await fetch(`/api/riffs/${riff.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "ACTIVE" }),
            });
            return activateResponse.ok;
          };

          const succeeded =
            (await createAndActivateRiff()) || (await createAndActivateRiff());
          if (!succeeded) {
            console.error(
              "Failed to create first riff for new club after retry"
            );
          }
        }
      } catch (riffErr) {
        console.error("Error creating first riff for new club:", riffErr);
      }

      sessionStorage.removeItem("pendingClubFrom");

      // Redirect to club page — What's Next modal fires via ?welcome=host
      router.push(`/clubs/${clubId}?welcome=host`);
    } catch (err: any) {
      console.error("Error creating club:", err);
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    // Tiled noise, not cover — see NoiseBackground.tsx: tiling rasterizes
    // once at its natural size instead of re-rasterizing a live filter on
    // every resize (mobile keyboard open/close, URL bar collapse, etc.).
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: "100vh",
        ...noiseTileStyle,
      }}
    >
      {/* Hero — full-bleed brush-reveal hero, ported from the landing page's
          "Start a write club." line. Renders once for the whole flow — only
          the card below swaps per step, so the reveal never replays. */}
      <div
        ref={heroRef}
        className="cchero-hero"
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "24px 24px 96px",
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
          <div className="cchero-frame" style={{ margin: "0" }}>
            <h1 className="cchero-line">
              <TextWord delay={HERO_SEQ.startA.delay} dur={HERO_SEQ.startA.dur}>
                Start
              </TextWord>{" "}
              <TextWord delay={HERO_SEQ.startA.delay} dur={HERO_SEQ.startA.dur}>
                a
              </TextWord>{" "}
              <motion.span
                className="cchero-word-writeclub"
                style={{ x: writeclubX, y: writeclubY }}
              >
                write club
                <motion.div
                  className="cchero-word-svg-wrap"
                  initial={{ clipPath: "inset(0 0 0 100%)" }}
                  animate={{ clipPath: "inset(0 0 0 0%)" }}
                  transition={{
                    duration: HERO_SEQ.writeclub.dur,
                    ease: BRUSH_EASE,
                    delay: HERO_SEQ.writeclub.delay,
                  }}
                  onAnimationComplete={() => setWriteclubRevealed(true)}
                  data-revealed={writeclubRevealed || undefined}
                >
                  <motion.div
                    animate={idleWriteclub}
                    transition={idleLoopWriteclub}
                  >
                    <Image
                      src="/images/landing/write_club_lp.webp"
                      alt=""
                      width={847}
                      height={492}
                      priority
                      className="cchero-word-svg"
                    />
                  </motion.div>
                </motion.div>
              </motion.span>
              <TextWord delay={HERO_SEQ.period.delay} dur={HERO_SEQ.period.dur}>
                .
              </TextWord>
            </h1>
          </div>

          {/* Club details card — pulled up to overlap the bottom of the
              brush art, same technique as JoinRiffClient's .jrhero-card.
              Content swaps per step; the card itself stays put. */}
          <div
            className="cchero-card"
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
            <div style={{ width: "100%", display: "flex" }}>
              <BackButton onClick={handleBack} />
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {step === 1 && (
                <motion.form
                  key="step-1"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    setStep(2);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <Tagline
                      text="Who we are..."
                      color="#C01582"
                      width={116}
                      textColor="#FFFFFF"
                      fontSize={16}
                    />
                    <TextInput
                      type="text"
                      name="clubName"
                      placeholder="Dead Poets Society"
                      value={clubName}
                      onChange={(e) => setClubName(e.target.value)}
                      autoFocus
                      maxLength={CLUB_NAME_MAX}
                      error={clubName.length >= CLUB_NAME_MAX ? " " : undefined}
                    />
                  </div>

                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <Tagline
                      text="What we're about..."
                      color="#955CB5"
                      width={156}
                      textColor="#FFFFFF"
                      fontSize={16}
                    />
                    <TextInput
                      multiline
                      rows={3}
                      name="description"
                      placeholder="We don't read and write poetry because it's cute. We read and write poetry because..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={DESCRIPTION_MAX}
                      error={
                        description.length >= DESCRIPTION_MAX ? " " : undefined
                      }
                    />
                  </div>

                  <PrimaryButton type="submit">
                    Cool, what&apos;s next?
                  </PrimaryButton>
                  <OnboardingProgress
                    currentStep={1}
                    totalSteps={TOTAL_STEPS}
                  />
                </motion.form>
              )}

              {step === 2 && (
                <motion.form
                  key="step-2"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    setStep(3);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                  }}
                >
                  <Tagline
                    text="How often we riff..."
                    color="#EECF01"
                    width={162}
                    textColor="#000000"
                    fontSize={16}
                  />

                  <CadenceOptionList
                    value={cadence}
                    options={CREATION_CADENCE_OPTIONS}
                    onSelect={setCadence}
                  />

                  <span
                    style={{
                      fontFamily: "var(--font-dm-sans)",
                      fontSize: "12px",
                      fontWeight: 300,
                      color: "#9C9C9C",
                      textAlign: "center",
                    }}
                  >
                    Riffs run on repeat. You can adjust this later.
                  </span>
                  <PrimaryButton type="submit">Almost there...</PrimaryButton>
                  <OnboardingProgress
                    currentStep={2}
                    totalSteps={TOTAL_STEPS}
                  />
                </motion.form>
              )}

              {step === 3 && (
                <motion.form
                  key="step-3"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  onSubmit={handleCreate}
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
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
                    <Tagline
                      text="This is our vibe..."
                      color="#01EFFC"
                      textColor="#000000"
                      width={156}
                      fontSize={16}
                    />
                    <ImageUploadFlow
                      ref={uploadFlowRef}
                      onSelect={(url) => setBannerImage(url)}
                      currentImage={bannerImage || null}
                      aspectRatio={3 / 1}
                      removeLabel="Remove photo"
                      hideSaveButton
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

                  <PrimaryButton
                    type="submit"
                    loading={loading}
                    disabled={loading}
                  >
                    Create your club
                  </PrimaryButton>
                  <OnboardingProgress
                    currentStep={3}
                    totalSteps={TOTAL_STEPS}
                  />
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <style>{`
        /* Ported from LandingClientPage's hero CSS (writeclub variant) — the
           transparent-text + absolutely-positioned brush-art overlay
           technique, scoped to just the "write club" word since this page
           only needs one line. Positioning values (top/left/width) match
           the landing page's own .word-svg-wrap-writeclub rules. */
        .cchero-word-writeclub {
          position: relative;
          display: inline-block;
          color: transparent;
          z-index: -1;
        }
        .cchero-text-word {
          display: inline-block;
        }
        .cchero-word-svg-wrap {
          position: absolute;
          height: auto;
          pointer-events: none;
          user-select: none;
          overflow: visible;
          z-index: -1;
          will-change: transform, clip-path;
          top: 24px;
          left: 0;
          width: 847px;
        }
        .cchero-word-svg-wrap[data-revealed] {
          clip-path: none !important;
          will-change: auto;
        }
        .cchero-word-svg {
          display: block;
          width: 100%;
          height: auto;
        }
        .cchero-frame {
          position: relative;
          width: 940px;
          max-width: 100%;
          /* Reserve room for the art's full bleed (top offset + rendered
             height) so .cchero-hero's overflow:hidden doesn't truncate it. */
          height: 600px;
        }
        .cchero-line {
          margin: 0;
          font-family: var(--font-dm-serif-text);
          font-size: 96px;
          line-height: 132px;
          font-weight: 400;
          color: #000000;
          text-align: left;
        }
        .cchero-card {
          margin-top: -420px;
        }
        @media (max-width: 767px) {
          .cchero-hero {
            padding: 16px 24px 64px !important;
          }
          .cchero-frame {
            height: 440px;
          }
          .cchero-line {
            font-size: clamp(56px, 18vw, 72px);
            line-height: 1.375;
            text-align: center;
          }
          .cchero-word-svg-wrap {
            top: 16px;
            left: 0;
            width: 635px;
          }
          .cchero-card {
            margin-top: -200px;
          }
        }
      `}</style>
    </div>
  );
}
