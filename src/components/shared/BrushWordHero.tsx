"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion";

// Ported from LandingClientPage's hero — same brush-reveal ease, same
// rise-and-fade word treatment. Originally duplicated across JoinRiffClient
// ("Riff with friends.") and the create-club onboarding page ("Start a
// write club."); pulled out here once a third consumer (full-page riff
// creation) needed the same "Riff" treatment.
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
      className="bwh-text-word"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: dur, delay, ease: "easeOut" }}
    >
      {children}
    </motion.span>
  );
}

export type BrushWord = "riff" | "writeclub";

interface BrushWordHeroProps {
  /** "riff" renders "Riff with friends." · "writeclub" renders "Start a write club." */
  word: BrushWord;
  /** Extra class name for the outer wrapper (layout hooks only — do not use to override the ported visuals). */
  className?: string;
}

export default function BrushWordHero({ word, className }: BrushWordHeroProps) {
  const reducedMotion = useReducedMotion();
  const heroRef = useRef<HTMLDivElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  // Mouse parallax — normalized cursor position [-1, 1] across the hero frame.
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 60, damping: 18, mass: 0.6 });
  const smoothY = useSpring(mouseY, { stiffness: 60, damping: 18, mass: 0.6 });
  const par = reducedMotion ? 4 : 18;

  // "riff" leans one way, "writeclub" the other, so the two words don't
  // move in lockstep when both appear on the landing page.
  const sign = word === "riff" ? -1 : 1;
  const wordX = useTransform(smoothX, [-1, 1], [sign * par, -sign * par]);
  const wordY = useTransform(
    smoothY,
    [-1, 1],
    [sign * par * 0.55, -sign * par * 0.55]
  );

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
  const idleAnim =
    word === "riff"
      ? {
          rotate: [0, 1.5 * amp, 0, -1.5 * amp, 0],
          y: [0, -6 * amp, 0, 6 * amp, 0],
        }
      : {
          rotate: [0, -1.5 * amp, 0, 1.5 * amp, 0],
          y: [0, 6 * amp, 0, -6 * amp, 0],
        };
  const idleLoop = {
    duration:
      word === "riff" ? (reducedMotion ? 9 : 5.5) : reducedMotion ? 10 : 6,
    repeat: Infinity,
    ease: "easeInOut" as const,
    delay: word === "riff" ? 1.4 : 1.7,
  };

  const SEQ =
    word === "riff"
      ? reducedMotion
        ? { word: { delay: 0.1, dur: 0.5 }, rest: { delay: 0.55, dur: 0.35 } }
        : { word: { delay: 0.15, dur: 0.95 }, rest: { delay: 0.95, dur: 0.55 } }
      : reducedMotion
        ? {
            lead: { delay: 0.9, dur: 0.35 },
            word: { delay: 1.2, dur: 0.5 },
            rest: { delay: 1.45, dur: 0.3 },
          }
        : {
            lead: { delay: 1.5, dur: 0.55 },
            word: { delay: 1.95, dur: 0.95 },
            rest: { delay: 2.45, dur: 0.45 },
          };

  const clipInitial =
    word === "riff" ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)";
  const clipAnimate = word === "riff" ? "inset(0 0% 0 0)" : "inset(0 0 0 0%)";

  const image =
    word === "riff"
      ? { src: "/images/landing/riff_lp.webp", width: 612, height: 520 }
      : { src: "/images/landing/write_club_lp.webp", width: 847, height: 492 };

  return (
    <div
      ref={heroRef}
      className={`bwh-frame bwh-frame-${word}${className ? ` ${className}` : ""}`}
    >
      <h1 className="bwh-line">
        {word === "writeclub" && (
          <>
            <TextWord delay={SEQ.lead!.delay} dur={SEQ.lead!.dur}>
              Start
            </TextWord>{" "}
            <TextWord delay={SEQ.lead!.delay} dur={SEQ.lead!.dur}>
              a
            </TextWord>{" "}
          </>
        )}
        <motion.span
          className={`bwh-word bwh-word-${word}`}
          style={{ x: wordX, y: wordY }}
        >
          {word === "riff" ? "Riff" : "write club"}
          <motion.div
            className="bwh-word-svg-wrap"
            initial={{ clipPath: clipInitial }}
            animate={{ clipPath: clipAnimate }}
            transition={{
              duration: SEQ.word.dur,
              ease: BRUSH_EASE,
              delay: SEQ.word.delay,
            }}
            onAnimationComplete={() => setRevealed(true)}
            data-revealed={revealed || undefined}
          >
            <motion.div animate={idleAnim} transition={idleLoop}>
              <Image
                src={image.src}
                alt=""
                width={image.width}
                height={image.height}
                priority
                className="bwh-word-img"
              />
            </motion.div>
          </motion.div>
        </motion.span>
        {word === "riff" ? (
          <>
            {" "}
            <TextWord delay={SEQ.rest.delay} dur={SEQ.rest.dur}>
              with
            </TextWord>{" "}
            <TextWord delay={SEQ.rest.delay} dur={SEQ.rest.dur}>
              friends.
            </TextWord>
          </>
        ) : (
          <TextWord delay={SEQ.rest.delay} dur={SEQ.rest.dur}>
            .
          </TextWord>
        )}
      </h1>

      <style>{`
        .bwh-word {
          position: relative;
          display: inline-block;
          color: transparent;
          z-index: -1;
        }
        .bwh-text-word {
          display: inline-block;
        }
        .bwh-word-svg-wrap {
          position: absolute;
          height: auto;
          pointer-events: none;
          user-select: none;
          overflow: visible;
          z-index: -1;
          will-change: transform, clip-path;
        }
        .bwh-word-svg-wrap[data-revealed] {
          clip-path: none !important;
          will-change: auto;
        }
        .bwh-word-img {
          display: block;
          width: 100%;
          height: auto;
        }
        .bwh-line {
          margin: 0;
          font-family: var(--font-dm-serif-text);
          font-size: 96px;
          line-height: 132px;
          font-weight: 400;
          color: #000000;
          text-align: left;
        }

        .bwh-frame {
          position: relative;
          max-width: 100%;
        }
        .bwh-frame-riff {
          width: 898px;
          height: 640px;
        }
        .bwh-frame-riff .bwh-word-svg-wrap {
          top: 24px;
          left: -445px;
          width: 612px;
        }
        .bwh-frame-writeclub {
          width: 940px;
          height: 600px;
        }
        .bwh-frame-writeclub .bwh-word-svg-wrap {
          top: 24px;
          left: 0;
          width: 847px;
        }

        @media (max-width: 767px) {
          .bwh-line {
            font-size: clamp(56px, 18vw, 72px);
            line-height: 1.375;
            text-align: center;
          }
          .bwh-frame-riff {
            height: 480px;
          }
          .bwh-frame-riff .bwh-word-svg-wrap {
            top: 16px;
            left: -342px;
            width: 463px;
          }
          .bwh-frame-writeclub {
            height: 440px;
          }
          .bwh-frame-writeclub .bwh-word-svg-wrap {
            top: 16px;
            left: 0;
            width: 635px;
          }
        }
      `}</style>
    </div>
  );
}
