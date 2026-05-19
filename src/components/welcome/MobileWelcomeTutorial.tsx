"use client";

import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import React, { useRef } from "react";
import Image from "next/image";
import TutorialStage from "./TutorialStage";
import NoiseBackground from "@/components/NoiseBackground";
import {
  Ease,
  Scene,
  SCENES,
  rangeProgress,
  sceneRise,
} from "./tutorial-utils";

const CANVAS_W = 390;
const CANVAS_H = 780;

// Desktop readyAt values include arrow animation time (~1.8s) that doesn't
// exist on mobile. Override to note-finish + small read buffer instead.
const MOBILE_READY_AT: Partial<Record<Scene["id"], number>> = {
  club: 4.0, // note ~11 words → done at 3.6s; was 6 (included arrow draw)
  riff: 4.0, // note ~11 words → done at 3.6s; was 7
  write: 12.5, // lock badge stamps at 11.5s; was 13
  reveal: 7.0, // note starts at 5.5s + 7 words; was 7.5
  read: 7.0, // last comment card at 6.3s; was 7.5
};

const MOBILE_SCENES: Scene[] = SCENES.map((s) =>
  MOBILE_READY_AT[s.id] != null ? { ...s, readyAt: MOBILE_READY_AT[s.id]! } : s
);

// ─── Shared brush highlight (same as desktop)

const BRUSH_FILTERS: Record<string, string> = {
  "#EECF01": "none",
  "#C01582":
    "brightness(0) saturate(100%) invert(18%) sepia(82%) saturate(3721%) hue-rotate(307deg) brightness(95%) contrast(98%)",
  "#955CB5":
    "brightness(0) saturate(100%) invert(42%) sepia(42%) saturate(887%) hue-rotate(232deg) brightness(94%) contrast(89%)",
  "#FF6B35":
    "brightness(0) saturate(100%) invert(57%) sepia(87%) saturate(2645%) hue-rotate(339deg) brightness(101%) contrast(101%)",
  "#01EFFC":
    "brightness(0) saturate(100%) invert(79%) sepia(91%) saturate(2670%) hue-rotate(137deg) brightness(103%) contrast(101%)",
  "#00FF66":
    "brightness(0) saturate(100%) invert(61%) sepia(97%) saturate(1000%) hue-rotate(88deg) brightness(102%) contrast(101%)",
};

function BrushHighlight({
  children,
  color = "#EECF01",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        padding: "0 10px",
        zIndex: 0,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/tagline_vector.svg"
        alt=""
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "12%",
          bottom: "-4%",
          width: "100%",
          height: "92%",
          filter: BRUSH_FILTERS[color] ?? "none",
          pointerEvents: "none",
          zIndex: -1,
        }}
      />
      <span style={{ position: "relative", zIndex: 1 }}>{children}</span>
    </span>
  );
}

// ─── Intro scene (portrait canvas — 390×780 center)

const MOBILE_INTRO_COPIES = Array.from({ length: 20 }, (_, i) => {
  const s1 = ((i * 9301 + 49297) % 233280) / 233280;
  const s2 = ((i * 73 + 19) % 100) / 100;
  const s3 = ((i * 6271 + 2499) % 4789) / 4789;
  const s4 = ((i * 1181 + 5003) % 7919) / 7919;
  const s5 = ((i * 3571 + 1009) % 1597) / 1597;
  return {
    x: 30 + s1 * 330,
    y: 40 + s2 * 700,
    rot: (s3 - 0.5) * 56,
    size: 36 + s4 * 56,
    delay: s5 * 0.18,
  };
});

function MobileIntroScene({
  time,
}: {
  time: number;
  scene: Scene;
  isManual: boolean;
}) {
  const centerIn = rangeProgress(time, 0, 0.5, Ease.out);
  const centerOut = rangeProgress(time, 4.0, 4.8, Ease.out);
  const centerOpacity = centerIn * (1 - centerOut);
  const collapseT = rangeProgress(time, 3.0, 3.8, Ease.inOut);

  return (
    <>
      <NoiseBackground fillMode="cover" />
      {MOBILE_INTRO_COPIES.map((copy, i) => {
        const burstT = rangeProgress(time, 1.0 + copy.delay, 2.0, Ease.outBack);
        const prog = burstT * (1 - collapseT);
        const copyOpacity = Math.min(burstT, 1 - collapseT);
        if (copyOpacity <= 0) return null;
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src="/images/riff_wordmark_black_outline.svg"
            alt=""
            aria-hidden
            style={{
              position: "absolute",
              width: copy.size,
              height: "auto",
              left: 195 + (copy.x - 195) * prog,
              top: 390 + (copy.y - 390) * prog,
              transform: `translate(-50%, -50%) rotate(${copy.rot * prog}deg)`,
              opacity: copyOpacity,
              pointerEvents: "none",
            }}
          />
        );
      })}
      {centerOpacity > 0 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/images/riff_wordmark_black_outline.svg"
          alt="Riff"
          style={{
            position: "absolute",
            width: 140,
            height: "auto",
            left: 195,
            top: 390,
            transform: "translate(-50%, -50%)",
            opacity: centerOpacity,
            pointerEvents: "none",
          }}
        />
      )}
    </>
  );
}

// ─── Shared mobile layout: headline top, screenshot below, note at bottom

interface MobileSceneLayoutProps {
  time: number;
  scene: Scene;
  screenshotSrc: string;
  screenshotWidth: number;
  screenshotHeight: number;
  screenshotRotate?: number;
  note: string;
  children?: React.ReactNode;
}

function MobileSceneLayout({
  time,
  scene,
  screenshotSrc,
  screenshotWidth,
  screenshotHeight,
  screenshotRotate = -1.2,
  note,
  children,
}: MobileSceneLayoutProps) {
  const env = sceneRise(time, scene.start, 0.5);

  // Headline line animations
  const headlineStart = scene.start + 0.3;
  const headlineLineDur = 0.55;
  const headlineLineDelay = 0.4;

  // Screenshot enter
  const screenIn = rangeProgress(
    time,
    scene.start,
    scene.start + 0.7,
    Ease.outBack
  );

  // Note reveal (word by word)
  const noteStart = scene.start + 2.2;
  const noteWords = note.split(/\s+/).filter(Boolean);

  // Constrain screenshot to fit the allotted zone (y:210–510 = 300px tall, 358px wide)
  const maxW = 358;
  const maxH = 290;
  const ratio = screenshotWidth / screenshotHeight;
  let dispW = maxW;
  let dispH = dispW / ratio;
  if (dispH > maxH) {
    dispH = maxH;
    dispW = dispH * ratio;
  }
  const screenX = (CANVAS_W - dispW) / 2;
  const screenY = 215;

  return (
    <div style={{ position: "absolute", inset: 0, background: "#FFFEF8" }}>
      {/* Paper noise */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.08 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`,
          opacity: 0.6,
          pointerEvents: "none",
        }}
      />

      {/* Headline */}
      <div
        style={{
          position: "absolute",
          left: 24,
          top: 68,
          maxWidth: CANVAS_W - 48,
          opacity: env,
          transform: `translateY(${(1 - env) * 10}px)`,
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {scene.headline.map((line, i) => {
          const lineStart = headlineStart + i * headlineLineDelay;
          const lineIn = rangeProgress(
            time,
            lineStart,
            lineStart + headlineLineDur,
            Ease.out
          );
          const isHighlight = i === scene.headline.length - 1;
          return (
            <div
              key={i}
              style={{
                fontFamily: "var(--font-dm-serif-text), Georgia, serif",
                fontWeight: 400,
                fontSize: 44,
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
                opacity: lineIn,
                transform: `translateY(${(1 - lineIn) * 12}px)`,
                alignSelf: "flex-start",
                color: "#000",
              }}
            >
              {isHighlight ? (
                <BrushHighlight color={scene.highlightColor}>
                  {line}
                </BrushHighlight>
              ) : (
                line
              )}
            </div>
          );
        })}
      </div>

      {/* Screenshot polaroid */}
      {screenIn > 0.005 && (
        <div
          style={{
            position: "absolute",
            left: screenX,
            top: screenY,
            width: dispW,
            height: dispH,
            background: "#FFF",
            border: "2px solid #000",
            boxShadow: "8px 8px 0 0 rgba(0,0,0,0.85)",
            transform: `rotate(${screenshotRotate}deg) scale(${screenIn})`,
            transformOrigin: "center",
            overflow: "hidden",
          }}
        >
          <Image
            src={screenshotSrc}
            alt=""
            width={screenshotWidth}
            height={screenshotHeight}
            priority
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top",
            }}
          />
          {children}
        </div>
      )}

      {/* Handwritten note */}
      <div
        style={{
          position: "absolute",
          left: 24,
          top: screenY + maxH + 24,
          maxWidth: CANVAS_W - 48,
          fontFamily: "var(--font-over-the-rainbow), cursive",
          fontSize: 26,
          color: "#000",
          lineHeight: 1.3,
          transform: `rotate(${-1 + (scene.id.charCodeAt(0) % 3)}deg)`,
          pointerEvents: "none",
          textShadow: "0 0 6px #FFFEF8, 0 0 6px #FFFEF8",
          zIndex: 5,
        }}
      >
        {noteWords.map((word, wi) => {
          const wIn = rangeProgress(
            time,
            noteStart + wi * 0.14,
            noteStart + wi * 0.14 + 0.18,
            Ease.out
          );
          return (
            <span
              key={wi}
              style={{
                display: "inline-block",
                opacity: wIn,
                transform: `translateY(${(1 - wIn) * 5}px)`,
                marginRight: wi < noteWords.length - 1 ? "0.25em" : 0,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── Individual scene components

function MobileClubScene({
  time,
  scene,
  isManual,
}: {
  time: number;
  scene: Scene;
  isManual: boolean;
}) {
  void isManual;
  return (
    <MobileSceneLayout
      time={time}
      scene={scene}
      screenshotSrc="/tutorial/screens/club-page.png"
      screenshotWidth={720}
      screenshotHeight={483}
      screenshotRotate={1.2}
      note="this is the club page, and here's you and your friends"
    />
  );
}

function MobileRiffScene({
  time,
  scene,
  isManual,
}: {
  time: number;
  scene: Scene;
  isManual: boolean;
}) {
  void isManual;
  return (
    <MobileSceneLayout
      time={time}
      scene={scene}
      screenshotSrc="/tutorial/screens/riff-page.png"
      screenshotWidth={720}
      screenshotHeight={576}
      screenshotRotate={-1.4}
      note="this is the riff page, everyone writes before time runs out"
    />
  );
}

// Write scene keeps the type-transition animation (parallel. → private.)
const WRITE_TYPE = {
  word1: "parallel.",
  word2: "private.",
  reverseOffset: 6.5,
  charDur: 0.08,
};

function MobileWriteScene({
  time,
  scene,
  isManual,
}: {
  time: number;
  scene: Scene;
  isManual: boolean;
}) {
  void isManual;
  const env = sceneRise(time, scene.start, 0.5);
  const headlineStart = scene.start + 0.3;
  const headlineDur = 0.55;
  const headlineDelay = 0.4;

  const line0In = rangeProgress(
    time,
    headlineStart,
    headlineStart + headlineDur,
    Ease.out
  );
  const line1In = rangeProgress(
    time,
    headlineStart + headlineDelay,
    headlineStart + headlineDelay + headlineDur,
    Ease.out
  );

  const { word1, word2, reverseOffset, charDur } = WRITE_TYPE;
  const reverseStart = scene.start + reverseOffset;
  const reverseDur = word1.length * charDur;
  let displayText = word1;
  if (time >= reverseStart) {
    const elapsed = time - reverseStart;
    if (elapsed < reverseDur) {
      const charsLeft = Math.max(
        0,
        word1.length - Math.floor(elapsed / charDur)
      );
      displayText = word1.slice(0, charsLeft);
    } else {
      const forwardElapsed = elapsed - reverseDur;
      const charsTyped = Math.min(
        word2.length,
        Math.floor(forwardElapsed / charDur) + 1
      );
      displayText = word2.slice(0, charsTyped);
    }
  }

  const screenIn = rangeProgress(
    time,
    scene.start,
    scene.start + 0.7,
    Ease.outBack
  );

  // LockBadge timing
  const lockSettleAt = scene.start + 11.5;
  const lockT = time - lockSettleAt;
  const stampIn = lockT >= 0 ? rangeProgress(lockT, 0, 0.4, Ease.outBack) : 0;
  const wobbleDecay =
    stampIn > 0 ? Math.max(0, 1 - Math.max(0, lockT - 0.4) / 0.6) : 0;
  const wobble =
    wobbleDecay > 0 ? Math.sin((lockT - 0.4) * 28) * wobbleDecay * 5 : 0;
  const lockScale = stampIn > 0 ? 2.2 - 1.2 * stampIn : 0;
  const ring1 = lockT >= 0 ? rangeProgress(lockT, 0.25, 0.95, Ease.out) : 0;
  const ring2 = lockT >= 0 ? rangeProgress(lockT, 0.4, 1.15, Ease.out) : 0;
  const accentColor = scene.highlightColor;

  // Screenshot dimensions
  const maxW = 358;
  const maxH = 290;
  const ratio = 610 / 670;
  let dispW = maxW;
  let dispH = dispW / ratio;
  if (dispH > maxH) {
    dispH = maxH;
    dispW = dispH * ratio;
  }
  const screenX = (CANVAS_W - dispW) / 2;
  const screenY = 215;

  return (
    <div style={{ position: "absolute", inset: 0, background: "#FFFEF8" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.08 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`,
          opacity: 0.6,
          pointerEvents: "none",
        }}
      />

      {/* Headline with type transition */}
      <div
        style={{
          position: "absolute",
          left: 24,
          top: 68,
          maxWidth: CANVAS_W - 48,
          opacity: env,
          transform: `translateY(${(1 - env) * 10}px)`,
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-dm-serif-text), Georgia, serif",
            fontWeight: 400,
            fontSize: 44,
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
            opacity: line0In,
            transform: `translateY(${(1 - line0In) * 12}px)`,
            alignSelf: "flex-start",
            color: "#000",
          }}
        >
          Write in
        </div>
        <div
          style={{
            fontFamily: "var(--font-dm-serif-text), Georgia, serif",
            fontWeight: 400,
            fontSize: 44,
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
            opacity: line1In,
            alignSelf: "flex-start",
            color: "#000",
          }}
        >
          {displayText ? (
            <BrushHighlight color={accentColor}>{displayText}</BrushHighlight>
          ) : null}
        </div>
      </div>

      {/* Write page screenshot */}
      {screenIn > 0.005 && (
        <div
          style={{
            position: "absolute",
            left: screenX,
            top: screenY,
            width: dispW,
            height: dispH,
            background: "#FFF",
            border: "2px solid #000",
            boxShadow: "8px 8px 0 0 rgba(0,0,0,0.85)",
            transform: `rotate(-1.2deg) scale(${screenIn})`,
            transformOrigin: "center",
            overflow: "hidden",
          }}
        >
          <Image
            src="/tutorial/screens/write-page.png"
            alt="Riff draft editor"
            width={610}
            height={670}
            priority
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top",
            }}
          />
        </div>
      )}

      {/* Lock badge — repositioned for portrait canvas */}
      {stampIn > 0 && (
        <div
          style={{
            position: "absolute",
            left: screenX + dispW - 10,
            top: screenY + 30,
            pointerEvents: "none",
            zIndex: 5,
          }}
        >
          {ring1 > 0 && ring1 < 1 && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 72,
                height: 72,
                borderRadius: "50%",
                border: "4px solid #000",
                transform: `translate(-50%, -50%) scale(${0.45 + ring1 * 1.85})`,
                opacity: 0.55 * (1 - ring1),
              }}
            />
          )}
          {ring2 > 0 && ring2 < 1 && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 72,
                height: 72,
                borderRadius: "50%",
                border: `4px solid ${accentColor}`,
                transform: `translate(-50%, -50%) scale(${0.45 + ring2 * 1.55})`,
                opacity: 0.85 * (1 - ring2),
              }}
            />
          )}
          <div
            style={{
              transform: `translate(-50%, -50%) scale(${lockScale}) rotate(${-10 + wobble}deg)`,
              transformOrigin: "center",
              opacity: stampIn,
              filter: "drop-shadow(3px 3px 0 rgba(0,0,0,0.9))",
            }}
          >
            <svg
              width="60"
              height="72"
              viewBox="0 0 64 80"
              style={{ display: "block" }}
            >
              <path
                d="M 18 32 V 22 a 14 14 0 0 1 28 0 V 32"
                fill="none"
                stroke="#000"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <rect
                x="8"
                y="32"
                width="48"
                height="42"
                rx="5"
                fill="#000"
                stroke="#000"
                strokeWidth="2"
              />
              <circle cx="32" cy="49" r="4.5" fill={accentColor} />
              <rect
                x="29.6"
                y="49"
                width="4.8"
                height="13"
                rx="1"
                fill={accentColor}
              />
            </svg>
          </div>
        </div>
      )}

      {/* Note */}
      <div
        style={{
          position: "absolute",
          left: 24,
          top: screenY + maxH + 24,
          maxWidth: CANVAS_W - 48,
          fontFamily: "var(--font-over-the-rainbow), cursive",
          fontSize: 26,
          color: "#000",
          lineHeight: 1.3,
          transform: "rotate(-1deg)",
          pointerEvents: "none",
          textShadow: "0 0 6px #FFFEF8, 0 0 6px #FFFEF8",
          zIndex: 5,
        }}
      >
        {["your", "writing", "stays", "private", "until", "the", "reveal"].map(
          (word, wi) => {
            const wIn = rangeProgress(
              time,
              scene.start + 2.2 + wi * 0.14,
              scene.start + 2.2 + wi * 0.14 + 0.18,
              Ease.out
            );
            return (
              <span
                key={wi}
                style={{
                  display: "inline-block",
                  opacity: wIn,
                  transform: `translateY(${(1 - wIn) * 5}px)`,
                  marginRight: wi < 6 ? "0.25em" : 0,
                }}
              >
                {word}
              </span>
            );
          }
        )}
      </div>
    </div>
  );
}

function MobileRevealScene({
  time,
  scene,
  isManual,
}: {
  time: number;
  scene: Scene;
  isManual: boolean;
}) {
  void isManual;
  const hasFiredConfetti = useRef(false);
  const sceneT = time - scene.start;

  const COVER_IN = 0.4,
    COVER_OUT = 3.5,
    COVER_OUT_DUR = 0.7;
  const PAGE_IN = 3.6,
    PAGE_IN_DUR = 0.7;
  const BURST_START = 1.8;

  if (sceneT >= BURST_START && !hasFiredConfetti.current) {
    hasFiredConfetti.current = true;
    const colors = [
      "#00FF66",
      "#01EFFC",
      "#EECF01",
      "#FF6B35",
      "#C01582",
      "#955CB5",
    ];
    confetti({
      particleCount: 70,
      angle: 60,
      spread: 60,
      origin: { x: 0.3, y: 0.65 },
      colors,
    });
    confetti({
      particleCount: 70,
      angle: 120,
      spread: 60,
      origin: { x: 0.7, y: 0.65 },
      colors,
    });
    setTimeout(
      () =>
        confetti({
          particleCount: 50,
          angle: 90,
          spread: 70,
          origin: { x: 0.5, y: 0.55 },
          colors,
        }),
      300
    );
  }

  const coverIn = rangeProgress(sceneT, COVER_IN, COVER_IN + 0.5, Ease.outBack);
  const coverOut = rangeProgress(
    sceneT,
    COVER_OUT,
    COVER_OUT + COVER_OUT_DUR,
    Ease.inOut
  );
  const coverOpacity = coverIn * (1 - coverOut);

  const pageIn = rangeProgress(
    sceneT,
    PAGE_IN,
    PAGE_IN + PAGE_IN_DUR,
    Ease.out
  );
  const pageTy = (1 - pageIn) * 16;

  // Cover: 480×560 ratio = 6:7. Fit in maxW=280, maxH=290
  const coverRatio = 480 / 560;
  let cW = 280;
  let cH = cW / coverRatio;
  if (cH > 310) {
    cH = 310;
    cW = cH * coverRatio;
  }
  const coverX = (CANVAS_W - cW) / 2;
  const coverY = 200;

  // Reveal page: 720×456 ratio. Fit in maxW=358, maxH=260
  const pageRatio = 720 / 456;
  let pW = 358;
  let pH = pW / pageRatio;
  if (pH > 260) {
    pH = 260;
    pW = pH * pageRatio;
  }
  const pageX = (CANVAS_W - pW) / 2;
  const pageY = 215;

  const env = sceneRise(time, scene.start, 0.5);
  const headlineStart = scene.start + 0.3;
  const line0In = rangeProgress(
    time,
    headlineStart,
    headlineStart + 0.55,
    Ease.out
  );
  const line1In = rangeProgress(
    time,
    headlineStart + 0.4,
    headlineStart + 0.95,
    Ease.out
  );

  return (
    <div style={{ position: "absolute", inset: 0, background: "#FFFEF8" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.08 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`,
          opacity: 0.6,
          pointerEvents: "none",
        }}
      />

      {/* Headline */}
      <div
        style={{
          position: "absolute",
          left: 24,
          top: 68,
          maxWidth: CANVAS_W - 48,
          opacity: env,
          transform: `translateY(${(1 - env) * 10}px)`,
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-dm-serif-text), Georgia, serif",
            fontWeight: 400,
            fontSize: 44,
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
            opacity: line0In,
            transform: `translateY(${(1 - line0In) * 12}px)`,
            color: "#000",
          }}
        >
          Then —
        </div>
        <div
          style={{
            fontFamily: "var(--font-dm-serif-text), Georgia, serif",
            fontWeight: 400,
            fontSize: 44,
            lineHeight: 1.08,
            letterSpacing: "-0.02em",
            opacity: line1In,
            color: "#000",
          }}
        >
          <BrushHighlight color={scene.highlightColor}>
            the reveal.
          </BrushHighlight>
        </div>
      </div>

      {/* Cover card */}
      {coverOpacity > 0.005 && (
        <div
          style={{
            position: "absolute",
            left: coverX,
            top: coverY,
            width: cW,
            height: cH,
            background: "#FFF",
            border: "2px solid #000",
            boxShadow: "8px 8px 0 0 rgba(0,0,0,0.85)",
            transform: `rotate(-1.5deg) scale(${coverIn})`,
            transformOrigin: "center",
            opacity: coverOpacity,
            overflow: "hidden",
            zIndex: 2,
          }}
        >
          <Image
            src="/tutorial/screens/reveal-cover.png"
            alt="Riff volume cover"
            fill
            priority
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
        </div>
      )}

      {/* Reveal page */}
      {pageIn > 0.005 && (
        <div
          style={{
            position: "absolute",
            left: pageX,
            top: pageY,
            width: pW,
            height: pH,
            background: "#FFF",
            border: "2px solid #000",
            boxShadow: "8px 8px 0 0 rgba(0,0,0,0.85)",
            transform: `translateY(${pageTy}px) rotate(1.2deg)`,
            opacity: pageIn,
            overflow: "hidden",
            zIndex: 1,
          }}
        >
          <Image
            src="/tutorial/screens/reveal-page.png"
            alt="Riff post-reveal page"
            width={720}
            height={456}
            priority
            style={{ width: "100%", height: "auto" }}
          />
        </div>
      )}

      {/* Note */}
      {(() => {
        const noteWords = [
          "once everyone submits,",
          "pieces unlock simultaneously",
        ];
        const noteStart = scene.start + 5.5;
        return (
          <div
            style={{
              position: "absolute",
              left: 24,
              top: coverY + 310 + 20,
              maxWidth: CANVAS_W - 48,
              fontFamily: "var(--font-over-the-rainbow), cursive",
              fontSize: 26,
              color: "#000",
              lineHeight: 1.3,
              transform: "rotate(-0.5deg)",
              pointerEvents: "none",
              textShadow: "0 0 6px #FFFEF8, 0 0 6px #FFFEF8",
              zIndex: 5,
            }}
          >
            {noteWords.map((phrase, pi) => (
              <div key={pi}>
                {phrase.split(/\s+/).map((word, wi) => {
                  const idx =
                    noteWords
                      .slice(0, pi)
                      .join(" ")
                      .split(/\s+/)
                      .filter(Boolean).length + wi;
                  const wIn = rangeProgress(
                    time,
                    noteStart + idx * 0.14,
                    noteStart + idx * 0.14 + 0.18,
                    Ease.out
                  );
                  return (
                    <span
                      key={wi}
                      style={{
                        display: "inline-block",
                        opacity: wIn,
                        transform: `translateY(${(1 - wIn) * 5}px)`,
                        marginRight: "0.25em",
                      }}
                    >
                      {word}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}

// ─── Read scene with cascading comment cards

const MOBILE_READ_COMMENTS = [
  {
    name: "Chris",
    color: "#FF6B35",
    text: "Not a Dodger fan, but Freddie's walk off was pretty dope",
    x: 20,
    y: 60,
    rot: -2,
    delay: 4.5,
    w: 200,
  },
  {
    name: "Derek",
    color: "#EECF01",
    text: "Field of Dreams is the best movie of all-time",
    x: 90,
    y: 140,
    rot: 2,
    delay: 5.4,
    w: 190,
  },
  {
    name: "Kyla",
    color: "#01EFFC",
    text: "I can't wait to see Riv grow as a baseball player",
    x: 30,
    y: 215,
    rot: -1.5,
    delay: 6.3,
    w: 195,
  },
];

function MobileReadScene({
  time,
  scene,
  isManual,
}: {
  time: number;
  scene: Scene;
  isManual: boolean;
}) {
  void isManual;
  const sceneT = time - scene.start;

  const screenIn = rangeProgress(
    time,
    scene.start,
    scene.start + 0.7,
    Ease.outBack
  );
  const overlayIn = rangeProgress(sceneT, 3.8, 4.6, Ease.out);

  // Read page: 760×628. Fit in maxW=358, maxH=290
  const maxW = 358;
  const maxH = 290;
  const ratio = 760 / 628;
  let dispW = maxW;
  let dispH = dispW / ratio;
  if (dispH > maxH) {
    dispH = maxH;
    dispW = dispH * ratio;
  }
  const screenX = (CANVAS_W - dispW) / 2;
  const screenY = 215;

  const env = sceneRise(time, scene.start, 0.5);
  const headlineStart = scene.start + 0.3;

  return (
    <div style={{ position: "absolute", inset: 0, background: "#FFFEF8" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence baseFrequency='0.9' numOctaves='2'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.08 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`,
          opacity: 0.6,
          pointerEvents: "none",
        }}
      />

      {/* Headline: 3 lines */}
      <div
        style={{
          position: "absolute",
          left: 24,
          top: 68,
          maxWidth: CANVAS_W - 48,
          opacity: env,
          transform: `translateY(${(1 - env) * 10}px)`,
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {scene.headline.map((line, i) => {
          const lineStart = headlineStart + i * 0.4;
          const lineIn = rangeProgress(
            time,
            lineStart,
            lineStart + 0.55,
            Ease.out
          );
          const isHighlight = i === scene.headline.length - 1;
          return (
            <div
              key={i}
              style={{
                fontFamily: "var(--font-dm-serif-text), Georgia, serif",
                fontWeight: 400,
                fontSize: 44,
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
                opacity: lineIn,
                transform: `translateY(${(1 - lineIn) * 12}px)`,
                alignSelf: "flex-start",
                color: "#000",
              }}
            >
              {isHighlight ? (
                <BrushHighlight color={scene.highlightColor}>
                  {line}
                </BrushHighlight>
              ) : (
                line
              )}
            </div>
          );
        })}
      </div>

      {/* Read page screenshot with overlay + comment cards */}
      {screenIn > 0.005 && (
        <div
          style={{
            position: "absolute",
            left: screenX,
            top: screenY,
            width: dispW,
            height: dispH,
            background: "#FFF",
            border: "2px solid #000",
            boxShadow: "8px 8px 0 0 rgba(0,0,0,0.85)",
            transform: `rotate(-1.6deg) scale(${screenIn})`,
            transformOrigin: "center",
            overflow: "hidden",
          }}
        >
          <Image
            src="/tutorial/screens/read-page.png"
            alt="Riff reading page"
            width={760}
            height={628}
            priority
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top",
            }}
          />
          {overlayIn > 0 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `rgba(0,0,0,${overlayIn * 0.5})`,
                pointerEvents: "none",
              }}
            />
          )}
          {MOBILE_READ_COMMENTS.map((c, i) => {
            const cardIn = rangeProgress(
              sceneT,
              c.delay,
              c.delay + 0.5,
              Ease.outBack
            );
            if (cardIn <= 0) return null;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: c.x,
                  top: c.y,
                  width: c.w,
                  transform: `translateY(${(1 - cardIn) * 20}px) rotate(${c.rot}deg) scale(${0.88 + 0.12 * cardIn})`,
                  transformOrigin: "center",
                  opacity: cardIn,
                  background: "#FFFEF8",
                  border: "2px solid #000",
                  boxShadow: `4px 4px 0 0 ${c.color}`,
                  padding: "6px 10px 10px",
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                }}
              >
                <div
                  style={{
                    flex: "0 0 auto",
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: c.color,
                    border: "1.5px solid #000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 11,
                    color: "#000",
                  }}
                >
                  {c.name[0]}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      lineHeight: 1,
                      marginBottom: 3,
                    }}
                  >
                    {c.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 400,
                      lineHeight: 1.3,
                      color: "#000",
                    }}
                  >
                    {c.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Note */}
      <div
        style={{
          position: "absolute",
          left: 24,
          top: screenY + maxH + 24,
          maxWidth: CANVAS_W - 48,
          fontFamily: "var(--font-over-the-rainbow), cursive",
          fontSize: 26,
          color: "#000",
          lineHeight: 1.3,
          transform: "rotate(1deg)",
          pointerEvents: "none",
          textShadow: "0 0 6px #FFFEF8, 0 0 6px #FFFEF8",
          zIndex: 5,
        }}
      >
        {["like", "leaving", "notes", "in", "the", "margin"].map((word, wi) => {
          const wIn = rangeProgress(
            time,
            scene.start + 2.2 + wi * 0.14,
            scene.start + 2.2 + wi * 0.14 + 0.18,
            Ease.out
          );
          return (
            <span
              key={wi}
              style={{
                display: "inline-block",
                opacity: wIn,
                transform: `translateY(${(1 - wIn) * 5}px)`,
                marginRight: wi < 5 ? "0.25em" : 0,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── Scene component map

const MOBILE_SCENE_COMPONENTS: Record<
  Scene["id"],
  React.ComponentType<{ time: number; scene: Scene; isManual: boolean }>
> = {
  intro: MobileIntroScene,
  club: MobileClubScene,
  riff: MobileRiffScene,
  write: MobileWriteScene,
  reveal: MobileRevealScene,
  read: MobileReadScene,
};

// ─── Orchestrator

export default function MobileWelcomeTutorial() {
  const router = useRouter();
  const duration = MOBILE_SCENES[MOBILE_SCENES.length - 1].end;

  const handleSkip = async () => {
    try {
      const res = await fetch("/api/users/me");
      const { user } = await res.json();
      if (user?.lastActiveClubId) {
        router.push(`/clubs/${user.lastActiveClubId}`);
      } else {
        router.push("/");
      }
    } catch {
      router.push("/");
    }
  };

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <TutorialStage
        scenes={MOBILE_SCENES}
        duration={duration}
        onSkip={handleSkip}
        canvasW={CANVAS_W}
        canvasH={CANVAS_H}
      >
        {(time, { isManual }) => {
          let activeScene = MOBILE_SCENES[0];
          for (const s of MOBILE_SCENES) {
            if (time < s.end) {
              activeScene = s;
              break;
            }
          }

          const SceneComp = MOBILE_SCENE_COMPONENTS[activeScene.id];

          return (
            <>
              {/* Paper noise for intro scene */}
              {activeScene.id !== "intro" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/images/riff_wordmark_black_outline.svg"
                  alt="Riff"
                  style={{
                    position: "absolute",
                    left: 20,
                    top: 18,
                    width: 44,
                    height: "auto",
                    display: "block",
                    pointerEvents: "none",
                    zIndex: 3,
                  }}
                />
              )}
              <SceneComp time={time} scene={activeScene} isManual={isManual} />
            </>
          );
        }}
      </TutorialStage>
    </div>
  );
}
