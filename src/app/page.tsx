"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useTransform,
  useReducedMotion,
  useSpring,
  type MotionValue,
  type Transition,
} from "framer-motion";
import LandingNavBar from "@/components/LandingNavBar";
import NoiseBackground from "@/components/NoiseBackground";
import { useIsMobile } from "@/hooks/useMediaQuery";

// Brush-reveal easing shared by both painted SVGs
const BRUSH_EASE: [number, number, number, number] = [0.4, 0, 0.1, 1];

// Natural display sizes per variant + viewport (from Figma)
const SVG_SIZES = {
  riff: {
    desktop: { w: 612, h: 520 },
    mobile: { w: 514, h: 437 },
  },
  writeclub: {
    desktop: { w: 847, h: 492 },
    mobile: { w: 706, h: 403 },
  },
} as const;

type Variant = "desktop" | "mobile";
type IdleAnim = { rotate: number[]; y: number[] };

type SeqStep = { delay: number; dur: number };
type MotionCfg = {
  idleRiff: IdleAnim;
  idleWriteClub: IdleAnim;
  idleLoopRiff: Transition;
  idleLoopWriteClub: Transition;
  ctaBreath: { scale?: number[] };
  ctaBreathTransition: Transition;
  SEQ: {
    riff: SeqStep;
    withFriends: SeqStep;
    startA: SeqStep;
    writeclub: SeqStep;
    period: SeqStep;
    cta: SeqStep;
  };
};

/** A plain headline word that fades in while rising 24px from below. */
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
      className="text-word"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: dur, delay, ease: "easeOut" }}
    >
      {children}
    </motion.span>
  );
}

/**
 * A painted-stroke headline word (Riff or write club). The HTML span carries
 * layout + accessible text (rendered transparent). Inside, the WebP brush-reveals
 * on entrance, then runs an idle drift loop. Mouse parallax x/y is applied to
 * the outer span.
 */
function BrushSvg({
  variant,
  size,
  parallaxX,
  parallaxY,
  delay,
  dur,
  idleAnim,
  idleTransition,
  revealed,
  onRevealed,
}: {
  variant: "riff" | "writeclub";
  size: Variant;
  parallaxX: MotionValue<number>;
  parallaxY: MotionValue<number>;
  delay: number;
  dur: number;
  idleAnim: IdleAnim;
  idleTransition: Transition;
  revealed: boolean;
  onRevealed: () => void;
}) {
  const isRiff = variant === "riff";
  const sizeSuffix = size === "mobile" ? "-mobile" : "";
  const wordClass = isRiff ? "word-riff" : "word-writeclub";
  const wrapClass = `word-svg-wrap-${variant}${sizeSuffix}`;
  const imgClass = `word-svg word-svg-${variant}${sizeSuffix}`;
  // WebP rasterized from the source SVGs (~1,200 path masks each). Bitmap
  // layers are GPU-cheap to rotate, where vector + mask forced full
  // re-rasterization every frame on mobile.
  const src = isRiff
    ? "/images/landing/riff_lp.webp"
    : "/images/landing/write_club_lp.webp";
  const label = isRiff ? "Riff" : "write club";
  const dim = SVG_SIZES[variant][size];
  // Riff reveals left-to-right (word baked at upper-right); write club reveals
  // right-to-left (word baked at upper-left). In both, the word is the LAST
  // pixel to land — feels like an artist signing at the end of a stroke.
  const initialClip = isRiff ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)";
  const finalClip = isRiff ? "inset(0 0% 0 0)" : "inset(0 0 0 0%)";

  return (
    <motion.span className={wordClass} style={{ x: parallaxX, y: parallaxY }}>
      {label}
      <motion.div
        className={`word-svg-wrap ${wrapClass}`}
        initial={{ clipPath: initialClip }}
        animate={{ clipPath: finalClip }}
        transition={{ duration: dur, ease: BRUSH_EASE, delay }}
        onAnimationComplete={onRevealed}
        data-revealed={revealed || undefined}
      >
        <motion.div animate={idleAnim} transition={idleTransition}>
          <Image
            src={src}
            alt=""
            width={dim.w}
            height={dim.h}
            priority
            className={imgClass}
          />
        </motion.div>
      </motion.div>
    </motion.span>
  );
}

/**
 * The hero scene: two headline lines + CTA, sequenced and animated.
 * Variant-specific class names switch between desktop and mobile layouts;
 * everything else (animation timing, content, motion config) is shared.
 */
function Hero({
  variant,
  cfg,
  riffX,
  riffY,
  writeclubX,
  writeclubY,
  riffRevealed,
  writeclubRevealed,
  onRiffRevealed,
  onWriteclubRevealed,
  onCTAClick,
}: {
  variant: Variant;
  cfg: MotionCfg;
  riffX: MotionValue<number>;
  riffY: MotionValue<number>;
  writeclubX: MotionValue<number>;
  writeclubY: MotionValue<number>;
  riffRevealed: boolean;
  writeclubRevealed: boolean;
  onRiffRevealed: () => void;
  onWriteclubRevealed: () => void;
  onCTAClick: () => void;
}) {
  const isDesktop = variant === "desktop";
  const wrapClass = isDesktop ? "hero-desktop" : "hero-mobile";
  const frameClass = isDesktop ? "hero-desktop-frame" : "hero-mobile-frame";
  const lineClass = isDesktop ? "hero-line" : "hero-line-m";
  const lineMod1 = isDesktop ? "hero-line-1" : "hero-line-m-1";
  const lineMod2 = isDesktop ? "hero-line-2" : "hero-line-m-2";
  const { SEQ } = cfg;

  return (
    <div className={wrapClass}>
      <div className={frameClass}>
        <h1 className={`${lineClass} ${lineMod1}`}>
          <BrushSvg
            variant="riff"
            size={variant}
            parallaxX={riffX}
            parallaxY={riffY}
            delay={SEQ.riff.delay}
            dur={SEQ.riff.dur}
            idleAnim={cfg.idleRiff}
            idleTransition={cfg.idleLoopRiff}
            revealed={riffRevealed}
            onRevealed={onRiffRevealed}
          />{" "}
          <TextWord delay={SEQ.withFriends.delay} dur={SEQ.withFriends.dur}>
            with
          </TextWord>{" "}
          <TextWord delay={SEQ.withFriends.delay} dur={SEQ.withFriends.dur}>
            friends.
          </TextWord>
        </h1>

        <h1 className={`${lineClass} ${lineMod2}`}>
          <TextWord delay={SEQ.startA.delay} dur={SEQ.startA.dur}>
            Start
          </TextWord>{" "}
          <TextWord delay={SEQ.startA.delay} dur={SEQ.startA.dur}>
            a
          </TextWord>{" "}
          <BrushSvg
            variant="writeclub"
            size={variant}
            parallaxX={writeclubX}
            parallaxY={writeclubY}
            delay={SEQ.writeclub.delay}
            dur={SEQ.writeclub.dur}
            idleAnim={cfg.idleWriteClub}
            idleTransition={cfg.idleLoopWriteClub}
            revealed={writeclubRevealed}
            onRevealed={onWriteclubRevealed}
          />
          <TextWord delay={SEQ.period.delay} dur={SEQ.period.dur}>
            .
          </TextWord>
        </h1>

        <div className="hero-cta-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: SEQ.cta.dur,
              delay: SEQ.cta.delay,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          >
            <motion.button
              className="hero-cta"
              onClick={onCTAClick}
              animate={cfg.ctaBreath}
              transition={cfg.ctaBreathTransition}
              whileTap={{
                x: 4,
                y: 4,
                boxShadow: "4px 4px 0px 0px #000000",
              }}
            >
              Let&apos;s do this
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement | null>(null);
  const [riffRevealed, setRiffRevealed] = useState(false);
  const [writeclubRevealed, setWriteclubRevealed] = useState(false);

  // Pre-hydration we render BOTH heroes so the existing CSS @media rule picks
  // the correct one — no flash of desktop hero on mobile devices. After
  // hydration we drop the unused hero so its framer-motion idle loop doesn't
  // keep ticking in the background (the actual mobile-perf win).
  const isMobile = useIsMobile();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const renderDesktop = !hydrated || !isMobile;
  const renderMobile = !hydrated || isMobile;

  // Mouse parallax — normalized cursor position [-1, 1] across the hero
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 60, damping: 18, mass: 0.6 });
  const smoothY = useSpring(mouseY, { stiffness: 60, damping: 18, mass: 0.6 });

  const par = reducedMotion ? 4 : 18;
  const riffX = useTransform(smoothX, [-1, 1], [-par, par]);
  const riffY = useTransform(smoothY, [-1, 1], [-par * 0.55, par * 0.55]);
  const writeclubX = useTransform(smoothX, [-1, 1], [par, -par]);
  const writeclubY = useTransform(smoothY, [-1, 1], [par * 0.55, -par * 0.55]);

  // Mouse parallax is desktop-only. Gate on `(hover: hover) and (pointer: fine)`
  // — the standard CSS signal for "real mouse cursor present" — so touch devices
  // don't pay for an event listener + spring updates they can't even trigger.
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

  // All motion config in one memo — only re-derives when reducedMotion flips.
  // Keeps animate/transition prop identities stable across renders.
  const cfg = useMemo<MotionCfg>(() => {
    const amp = reducedMotion ? 0.25 : 1;
    return {
      idleRiff: {
        rotate: [0, 1.5 * amp, 0, -1.5 * amp, 0],
        y: [0, -6 * amp, 0, 6 * amp, 0],
      },
      idleWriteClub: {
        rotate: [0, -1.5 * amp, 0, 1.5 * amp, 0],
        y: [0, 6 * amp, 0, -6 * amp, 0],
      },
      idleLoopRiff: {
        duration: reducedMotion ? 9 : 5.5,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 1.4,
      },
      idleLoopWriteClub: {
        duration: reducedMotion ? 10 : 6,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 1.7,
      },
      ctaBreath: reducedMotion ? {} : { scale: [1, 1.02, 1] },
      ctaBreathTransition: reducedMotion
        ? {}
        : { duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 1.6 },
      SEQ: reducedMotion
        ? {
            riff: { delay: 0.1, dur: 0.5 },
            withFriends: { delay: 0.55, dur: 0.35 },
            startA: { delay: 0.9, dur: 0.35 },
            writeclub: { delay: 1.2, dur: 0.5 },
            period: { delay: 1.45, dur: 0.3 },
            cta: { delay: 1.7, dur: 0.35 },
          }
        : {
            riff: { delay: 0.15, dur: 0.95 },
            withFriends: { delay: 0.95, dur: 0.55 },
            startA: { delay: 1.5, dur: 0.55 },
            writeclub: { delay: 1.95, dur: 0.95 },
            period: { delay: 2.45, dur: 0.45 },
            cta: { delay: 2.85, dur: 0.55 },
          },
    };
  }, [reducedMotion]);

  const onRiffRevealed = () => setRiffRevealed(true);
  const onWriteclubRevealed = () => setWriteclubRevealed(true);
  const onCTAClick = () => router.push("/login");

  const heroProps = {
    cfg,
    riffX,
    riffY,
    writeclubX,
    writeclubY,
    riffRevealed,
    writeclubRevealed,
    onRiffRevealed,
    onWriteclubRevealed,
    onCTAClick,
  };

  return (
    <div
      style={{
        height: "100vh",
        overflow: "hidden",
        position: "relative",
        backgroundColor: "#FFFFFF",
      }}
    >
      <NoiseBackground />

      <LandingNavBar />

      <main
        ref={heroRef}
        style={{
          position: "relative",
          overflow: "hidden",
          height: "calc(100vh - 77px)",
          zIndex: 1,
        }}
      >
        {renderDesktop && <Hero variant="desktop" {...heroProps} />}
        {renderMobile && <Hero variant="mobile" {...heroProps} />}
      </main>

      <style>{`
        /* Each word's HTML span anchors its painted-stroke SVG.
           HTML text is transparent; the SVG (inside the span) provides the visual. */
        .word-riff,
        .word-writeclub {
          position: relative;
          display: inline-block;
          color: transparent;
          /* The parallax x/y transform creates a stacking context on this span.
             Without z-index here, the whole span (incl. the SVG inside) paints
             on top of inline text like the trailing period. */
          z-index: -1;
        }
        /* Each plain-text word gets its own inline-block so framer-motion's
           transform actually applies (CSS spec: inline elements aren't
           transformable). The line still wraps naturally between words. */
        .text-word {
          display: inline-block;
        }
        .word-svg-wrap {
          position: absolute;
          height: auto;
          pointer-events: none;
          user-select: none;
          overflow: visible;
          z-index: -1;
          will-change: transform, clip-path;
        }
        /* Once the brush reveal completes, drop the clip-path entirely so
           idle drift + parallax don't get clipped at the wrap's bounds.
           !important needed to beat framer-motion's inline style.
           Also drop will-change so the layer stops being permanently promoted. */
        .word-svg-wrap[data-revealed] {
          clip-path: none !important;
          will-change: auto;
        }
        .word-svg {
          display: block;
          width: 100%;
          height: auto;
        }
        .word-svg-wrap-riff {
          top: 24px;
          left: -445px;
          width: 612px;
        }
        .word-svg-wrap-writeclub {
          top: 24px;
          left: 0;
          width: 847px;
        }
        .word-svg-wrap-riff-mobile {
          top: 16px;
          left: -342px;
          width: 463px;
        }
        .word-svg-wrap-writeclub-mobile {
          top: 16px;
          left: 0;
          width: 635px;
        }

        /* CTA visual — shared by both heroes */
        .hero-cta {
          background-color: #00FF66;
          border: 2px solid #000000;
          box-shadow: 8px 8px 0px 0px #000000;
          padding: 12px 48px;
          font-family: var(--font-dm-sans);
          font-size: 16px;
          font-weight: 300;
          color: #000000;
          cursor: pointer;
          white-space: nowrap;
          transition: background-color 0.2s ease, box-shadow 0.2s ease;
        }
        .hero-cta:hover {
          background-color: #FFFFFF;
          box-shadow: 8px 8px 0px 0px #00FF66;
        }
        .hero-cta-center {
          position: absolute;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          z-index: 3;
        }

        /* === DESKTOP === */
        .hero-desktop {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hero-desktop-frame {
          position: relative;
          width: 898px;
          height: 357px;
          transform: translateY(-80px);
        }
        .hero-line {
          position: absolute;
          left: 0;
          width: 898px;
          margin: 0;
          font-family: var(--font-dm-serif-text);
          font-size: 96px;
          line-height: 132px;
          font-weight: 400;
          color: #000000;
          z-index: 2;
        }
        .hero-line-1 { top: 0; text-align: left; }
        .hero-line-2 { top: 156px; text-align: right; }
        .hero-desktop .hero-cta-center { top: 312px; }

        /* === MOBILE === */
        .hero-mobile {
          display: none;
          position: absolute;
          inset: 0;
        }
        .hero-mobile-frame {
          position: relative;
          width: 100%;
          height: 100%;
        }
        .hero-line-m {
          position: absolute;
          left: 16px;
          right: 16px;
          margin: 0;
          font-family: var(--font-dm-serif-text);
          /* Reduced ~10% from 80→72 to leave room for centering on mobile.
             SVG widths below scale to match (72/80 ≈ 0.9 of previous). */
          font-size: clamp(56px, 18vw, 72px);
          line-height: 1.375;
          font-weight: 400;
          color: #000000;
          text-align: center;
          z-index: 2;
        }
        .hero-line-m-1 { top: 80px; }
        .hero-line-m-2 { top: 302px; }
        .hero-mobile .hero-cta-center { top: 520px; }

        @media (max-width: 767px) {
          .hero-desktop { display: none !important; }
          .hero-mobile { display: block !important; }
        }
      `}</style>
    </div>
  );
}
